import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProviderChain, GeminiProvider, GroqProvider, OpenRouterProvider, CerebrasProvider, MistralProvider, NvidiaProvider } from '@autoapply/ai-provider';

@Injectable()
export class AiObservabilityService {
  private aiProvider = new ProviderChain([
    new GeminiProvider(),
    new GroqProvider(),
    new CerebrasProvider(),
    new NvidiaProvider(),
    new MistralProvider(),
    new OpenRouterProvider(),
  ]);

  constructor(private readonly prisma: PrismaService) {}

  async listExecutions(limit: number, offset: number) {
    const total = await this.prisma.aIExecution.count();
    const items = await this.prisma.aIExecution.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
    return { items, total };
  }

  async getExecution(id: string) {
    return this.prisma.aIExecution.findUnique({
      where: { id },
    });
  }

  async testCacheCompare() {
    const promptInput = {
      type: 'TEST_CACHE_COMPARE',
      systemPrompt: 'You are a latency and observability test agent.',
      messages: [{ role: 'user' as const, content: 'Say "hello world" and nothing else.' }],
      responseFormat: 'text' as const,
    };

    // First call: Uncached (Force Refresh)
    const startUncached = Date.now();
    const uncachedResult = await this.aiProvider.generateText({
      ...promptInput,
      forceRefresh: true,
    });
    const latencyUncached = Date.now() - startUncached;

    // Second call: Cached
    const startCached = Date.now();
    const cachedResult = await this.aiProvider.generateText({
      ...promptInput,
      forceRefresh: false,
    });
    const latencyCached = Date.now() - startCached;

    return {
      promptText: promptInput.messages[0].content,
      uncached: {
        provider: uncachedResult.provider,
        latencyMs: latencyUncached,
        cached: uncachedResult.cached || false,
        text: uncachedResult.text,
      },
      cached: {
        provider: cachedResult.provider,
        latencyMs: latencyCached,
        cached: cachedResult.cached || false,
        text: cachedResult.text,
      },
    };
  }

  async getVerificationReport() {
    const features = [
      'RESUME_PARSE',
      'RESUME_ANALYSIS',
      'JOB_ANALYSIS',
      'COMPARISON',
      'TAILORING',
      'COVER_LETTER',
    ];

    const report: Record<string, any> = {};

    for (const feature of features) {
      const lastExec = await this.prisma.aIExecution.findFirst({
        where: { feature },
        orderBy: { createdAt: 'desc' },
      });

      if (lastExec) {
        const isReal =
          lastExec.provider !== 'mock' &&
          lastExec.provider !== 'offline' &&
          lastExec.provider !== 'unknown';
        report[feature] = {
          status: 'SUCCESS',
          usedRealLLM: isReal,
          provider: lastExec.provider,
          model: lastExec.model,
          latencyMs: lastExec.latencyMs,
          httpStatus: lastExec.httpStatus,
          timestamp: lastExec.createdAt,
          tokens: lastExec.totalTokens,
          cost: parseFloat(lastExec.cost.toString()),
          cacheStatus: lastExec.cacheStatus,
        };
      } else {
        report[feature] = {
          status: 'NOT_RUN_YET',
          usedRealLLM: false,
          message: 'This feature has not yet been executed in the current session.',
        };
      }
    }

    return report;
  }
}
