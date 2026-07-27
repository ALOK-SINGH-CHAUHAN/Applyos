import { AIProvider, GenerateTextInput, GenerateTextOutput, EmbeddingInput, EmbeddingOutput } from './ai-provider.interface';
import * as crypto from 'crypto';

export class AllProvidersFailedError extends Error {
  constructor(public readonly lastError: unknown) {
    super('All configured AI providers failed.');
    this.name = 'AllProvidersFailedError';
  }
}

// Track demoted providers and their active cooldown end times
const healthTracker = new Map<string, number>();
const consecutiveFailures = new Map<string, number>();

let prismaInstance: any;
function getPrisma() {
  if (!prismaInstance) {
    try {
      const { PrismaClient } = require('@prisma/client');
      prismaInstance = new PrismaClient();
    } catch (e) {
      console.warn('[AI Gateway] Failed to load PrismaClient, prompt caching disabled.');
    }
  }
  return prismaInstance;
}

function computeHash(systemPrompt: string, messages: any[], responseFormat?: string): string {
  const data = JSON.stringify({ systemPrompt, messages, responseFormat });
  return crypto.createHash('sha256').update(data).digest('hex');
}

export class ProviderChain implements AIProvider {
  name = 'chain';
  supportsStructuredOutput = true;

  constructor(private providers: AIProvider[]) {}

  async generateText(input: GenerateTextInput): Promise<GenerateTextOutput> {
    const hash = computeHash(input.systemPrompt || '', input.messages, input.responseFormat);
    const prisma = getPrisma();
    const useMock = false;
    let lastErrors: unknown[] = [];
    const now = Date.now();

    const runProviderWithRetries = async (provider: AIProvider): Promise<GenerateTextOutput> => {
      const cooldownEnd = healthTracker.get(provider.name) || 0;
      if (cooldownEnd > now) {
        console.log(`[AI Gateway] Provider ${provider.name} is demoted. Skipping...`);
        throw new Error(`Provider ${provider.name} is demoted.`);
      }

      let retryDelay = 1000;
      const maxRetries = 2;
      let lastProviderError: any;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const attemptStartTime = Date.now();
        try {
          if (attempt > 0) {
            console.log(`[AI Gateway] Retrying provider ${provider.name} (Attempt ${attempt}/${maxRetries}) after ${retryDelay}ms delay...`);
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
            retryDelay *= 2;
          }

          const result = await Promise.race([
            provider.generateText(input),
            new Promise<GenerateTextOutput>((_, reject) => 
              setTimeout(() => reject(new Error('AI Provider timeout (20s)')), 20000)
            )
          ]);
          const latencyMs = Date.now() - attemptStartTime;

          consecutiveFailures.set(provider.name, 0);
          healthTracker.delete(provider.name);

          if (prisma && !useMock) {
            try {
              let outputPayload: any = result.text;
              try {
                outputPayload = JSON.parse(result.text);
              } catch {}

              const validTypes = ['JOB_ANALYSIS', 'RESUME_MATCH', 'TAILORING', 'COVER_LETTER', 'PROPOSAL'];
              const outputType = validTypes.includes(input.type || '') ? input.type : 'JOB_ANALYSIS';

              await prisma.aIOutput.create({
                data: {
                  type: outputType as any,
                  inputRefType: input.inputRefType || 'ref',
                  inputRefId: input.inputRefId || 'id',
                  providerUsed: result.provider,
                  promptVersion: '1.0.0',
                  outputJson: outputPayload,
                  inputHash: hash,
                }
              }).catch(() => {});
            } catch (cacheWriteErr) {
              console.warn('[AI Gateway] Cache write error:', cacheWriteErr);
            }

            try {
              const promptTokens = result.usage?.promptTokens || 0;
              const completionTokens = result.usage?.completionTokens || 0;
              await prisma.aIExecution.create({
                data: {
                  feature: input.type || 'UNKNOWN',
                  provider: result.provider || provider.name,
                  model: (result as any).model || 'unknown',
                  latencyMs: (result as any).latencyMs || latencyMs,
                  promptTokens,
                  completionTokens,
                  totalTokens: promptTokens + completionTokens,
                  cacheStatus: 'MISS',
                  promptHash: hash,
                  responseHash: crypto.createHash('sha256').update(result.text).digest('hex'),
                  httpStatus: (result as any).httpStatus || 200,
                  cost: (result as any).cost || 0,
                  promptText: JSON.stringify({ systemPrompt: input.systemPrompt, messages: input.messages }),
                  responseText: result.text,
                }
              }).catch((dbErr: any) => console.warn('[AI Observability] Failed to log success execution:', dbErr));
            } catch (telemetryErr) {
              console.warn('[AI Observability] Error extracting success telemetry:', telemetryErr);
            }
          }

          return { ...result, cached: false };
        } catch (err: any) {
          lastProviderError = err;
          console.warn(`[AI Gateway] Attempt ${attempt} failed on provider ${provider.name}:`, err.message || err);

          if (prisma && !useMock) {
            try {
              await prisma.aIExecution.create({
                data: {
                  feature: input.type || 'UNKNOWN',
                  provider: provider.name,
                  model: 'unknown',
                  latencyMs: Date.now() - attemptStartTime,
                  promptTokens: 0,
                  completionTokens: 0,
                  totalTokens: 0,
                  cacheStatus: 'MISS',
                  promptHash: hash,
                  httpStatus: err.status || 500,
                  cost: 0,
                  promptText: JSON.stringify({ systemPrompt: input.systemPrompt, messages: input.messages }),
                  errorText: err.message || String(err),
                }
              }).catch((dbErr: any) => console.warn('[AI Observability] Failed to log failed execution:', dbErr));
            } catch (telemetryErr) {
              console.warn('[AI Observability] Error extracting failure telemetry:', telemetryErr);
            }
          }

          if (attempt === maxRetries) {
            const fails = (consecutiveFailures.get(provider.name) || 0) + 1;
            consecutiveFailures.set(provider.name, fails);

            if (fails >= 5) {
              const errMsg = (err.message || '').toLowerCase();
              const isTPM = errMsg.includes('tokens per minute') || errMsg.includes('tpm');
              const isDailyQuota = errMsg.includes('per day') || errMsg.includes('daily') || errMsg.includes('free-models-per-day') || errMsg.includes('quota exceeded');

              let cooldownMs = isTPM ? 35000 : isDailyQuota ? 3 * 60 * 60 * 1000 : 120000;
              healthTracker.set(provider.name, Date.now() + cooldownMs);
              const cooldownLabel = isTPM ? '35 seconds (TPM)' : isDailyQuota ? '3 hours (daily quota)' : '2 minutes';
              console.warn(`[AI Gateway] Provider ${provider.name} failed 5 consecutive times. Demoting for ${cooldownLabel}.`);
            }
          }
        }
      }
      throw lastProviderError;
    };

    const group1Names = ['gemini', 'groq', 'cerebras'];
    const group2Names = ['nvidia', 'mistral', 'openrouter'];

    const group1 = this.providers.filter(p => group1Names.includes(p.name));
    const group2 = this.providers.filter(p => group2Names.includes(p.name));

    try {
      if (group1.length > 0) {
        console.log(`[AI Gateway] Racing Group 1: ${group1.map(p => p.name).join(', ')}`);
        return await Promise.any(group1.map(p => runProviderWithRetries(p)));
      } else {
        throw new AggregateError([new Error("Group 1 empty")]);
      }
    } catch (g1Err: any) {
      console.warn(`[AI Gateway] All Group 1 providers failed. Falling back to Group 2.`);
      if (g1Err instanceof AggregateError) lastErrors.push(...g1Err.errors);
      else lastErrors.push(g1Err);

      try {
        if (group2.length > 0) {
          console.log(`[AI Gateway] Racing Group 2: ${group2.map(p => p.name).join(', ')}`);
          return await Promise.any(group2.map(p => runProviderWithRetries(p)));
        } else {
          throw new AggregateError([new Error("Group 2 empty")]);
        }
      } catch (g2Err: any) {
        console.warn(`[AI Gateway] All Group 2 providers failed. Falling back to Cache.`);
        if (g2Err instanceof AggregateError) lastErrors.push(...g2Err.errors);
        else lastErrors.push(g2Err);
      }
    }

    // Cache Fallback
    if (prisma && !input.forceRefresh && !useMock) {
      try {
        const cached = await prisma.aIOutput.findUnique({
          where: { inputHash: hash }
        });
        if (cached) {
          console.log(`\n[AI GATEWAY CACHE HIT (FALLBACK)]
Hash: ${hash}
Provider (Cached): ${cached.providerUsed}
Output returned instantly from database.\n`);
          
          let parsedOutput = cached.outputJson;
          if (typeof parsedOutput === 'string') {
            try { parsedOutput = JSON.parse(parsedOutput); } catch {}
          }
          const responseText = typeof cached.outputJson === 'string' ? cached.outputJson : JSON.stringify(cached.outputJson);
          return { text: responseText, provider: cached.providerUsed, cached: true };
        }
      } catch (cacheErr) {
        console.warn('[AI Gateway] Cache fallback read error:', cacheErr);
      }
    }

    throw new AllProvidersFailedError(lastErrors.length ? lastErrors : [new Error("No providers available")]);
  }

  async generateEmbedding(input: EmbeddingInput): Promise<EmbeddingOutput> {
    let lastError: unknown;
    for (const provider of this.providers) {
      try {
        return await provider.generateEmbedding(input);
      } catch (err) {
        lastError = err;
        console.warn(`[AI Gateway] Embedding call failed on ${provider.name}:`, err);
      }
    }
    throw new AllProvidersFailedError(lastError);
  }
}
