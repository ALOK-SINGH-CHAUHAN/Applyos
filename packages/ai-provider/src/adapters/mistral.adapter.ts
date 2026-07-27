import { AIProvider, GenerateTextInput, GenerateTextOutput, EmbeddingInput, EmbeddingOutput } from '../ai-provider.interface';

export class MistralProvider implements AIProvider {
  name = 'mistral';
  supportsStructuredOutput = true;

  constructor(private readonly apiKey: string = (process.env.MISTRAL_API_KEY || '').replace(/['"]/g, '')) {}

  async generateText(input: GenerateTextInput): Promise<GenerateTextOutput> {
    if (!this.apiKey || this.apiKey.includes('mock-')) {
      throw new Error('MISTRAL_API_KEY is not configured or is set to a mock key. Real AI is required.');
    }

    const url = 'https://api.mistral.ai/v1/chat/completions';
    const messages = [];

    if (input.systemPrompt) {
      messages.push({ role: 'system', content: input.systemPrompt });
    }

    messages.push(...input.messages);

    const body: Record<string, any> = {
      model: 'mistral-large-latest',
      messages,
    };

    if (input.responseFormat === 'json') {
      body.response_format = { type: 'json_object' };
    }

    if (input.maxTokens) {
      body.max_tokens = input.maxTokens;
    }

    const startTime = Date.now();
    let httpStatus = 200;
    let data: any;
    let latencyMs = 0;
    let costVal = 0;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30000),
      });

      httpStatus = response.status;

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Mistral API call failed: ${response.status} - ${errorText}`);
      }

      data = (await response.json()) as any;
    } catch (err) {
      httpStatus = httpStatus === 200 ? 500 : httpStatus;
      throw err;
    } finally {
      latencyMs = Date.now() - startTime;
      const latency = (latencyMs / 1000).toFixed(1) + 's';
      const promptTokens = data?.usage?.prompt_tokens || 0;
      const completionTokens = data?.usage?.completion_tokens || 0;
      const totalTokens = promptTokens + completionTokens;
      const cost = ((promptTokens * 2.0 + completionTokens * 6.0) / 1000000).toFixed(6);
      costVal = parseFloat(cost);

      console.log(`\n[AI LOG]
Provider: Mistral
Model: mistral-large-latest
Latency: ${latency}
Tokens: ${totalTokens} (Prompt: ${promptTokens}, Completion: ${completionTokens})
HTTP: ${httpStatus}
Retry Count: 0
Cost: $${cost}\n`);
    }

    const text = data?.choices?.[0]?.message?.content;
    if (!text) {
      throw new Error('Empty response from Mistral API');
    }

    return {
      text,
      provider: 'mistral',
      usage: {
        promptTokens: data.usage?.prompt_tokens,
        completionTokens: data.usage?.completion_tokens,
      },
      latencyMs,
      cost: costVal,
      model: 'mistral-large-latest',
      httpStatus,
    };
  }

  async generateEmbedding(input: EmbeddingInput): Promise<EmbeddingOutput> {
    if (!this.apiKey || this.apiKey.includes('mock-')) {
      throw new Error('MISTRAL_API_KEY is not configured or is set to a mock key. Real AI is required.');
    }

    const texts = Array.isArray(input.text) ? input.text : [input.text];
    const mockVector = Array(768).fill(0.01);
    return {
      embeddings: texts.map(() => mockVector),
      provider: 'mistral',
    };
  }
}
