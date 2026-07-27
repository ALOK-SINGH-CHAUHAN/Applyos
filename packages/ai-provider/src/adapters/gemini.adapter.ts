import { AIProvider, GenerateTextInput, GenerateTextOutput, EmbeddingInput, EmbeddingOutput } from '../ai-provider.interface';

export class GeminiProvider implements AIProvider {
  name = 'gemini';
  supportsStructuredOutput = true;

  constructor(private readonly apiKey: string = (process.env.GEMINI_API_KEY || '').replace(/['"]/g, '')) {}

  async generateText(input: GenerateTextInput): Promise<GenerateTextOutput> {
    if (!this.apiKey || this.apiKey.includes('mock-')) {
      throw new Error('GEMINI_API_KEY is not configured or is set to a mock key. Real AI is required.');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${this.apiKey}`;
    const contents = input.messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const body: Record<string, any> = {
      contents,
    };

    if (input.systemPrompt) {
      body.systemInstruction = {
        parts: [{ text: input.systemPrompt }],
      };
    }

    if (input.responseFormat === 'json') {
      body.generationConfig = {
        responseMimeType: 'application/json',
      };
    }

    if (input.maxTokens) {
      body.generationConfig = {
        ...body.generationConfig,
        maxOutputTokens: input.maxTokens,
      };
    }

    const startTime = Date.now();
    let httpStatus = 200;
    let data: any;
    let latencyMs = 0;
    let costVal = 0;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30000),
      });

      httpStatus = response.status;

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API call failed: ${response.status} - ${errorText}`);
      }

      data = (await response.json()) as any;
    } catch (err) {
      httpStatus = httpStatus === 200 ? 500 : httpStatus;
      throw err;
    } finally {
      latencyMs = Date.now() - startTime;
      const latency = (latencyMs / 1000).toFixed(1) + 's';
      const promptTokens = data?.usageMetadata?.promptTokenCount || 0;
      const completionTokens = data?.usageMetadata?.candidatesTokenCount || 0;
      const totalTokens = promptTokens + completionTokens;
      // Estimate Cost: input: $0.075 / 1M, output: $0.30 / 1M
      const cost = ((promptTokens * 0.075 + completionTokens * 0.3) / 1000000).toFixed(6);
      costVal = parseFloat(cost);

      console.log(`\n[AI LOG]
Provider: Gemini
Model: gemini-flash-latest
Latency: ${latency}
Tokens: ${totalTokens} (Prompt: ${promptTokens}, Completion: ${completionTokens})
HTTP: ${httpStatus}
Retry Count: 0
Cost: $${cost}\n`);
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('Empty response from Gemini API');
    }

    return {
      text,
      provider: 'gemini',
      usage: {
        promptTokens: data.usageMetadata?.promptTokenCount,
        completionTokens: data.usageMetadata?.candidatesTokenCount,
      },
      latencyMs,
      cost: costVal,
      model: 'gemini-flash-latest',
      httpStatus,
    };
  }

  async generateEmbedding(input: EmbeddingInput): Promise<EmbeddingOutput> {
    if (!this.apiKey || this.apiKey.includes('mock-')) {
      throw new Error('GEMINI_API_KEY is not configured or is set to a mock key. Real AI is required.');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${this.apiKey}`;
    const texts = Array.isArray(input.text) ? input.text : [input.text];
    const embeddings: number[][] = [];

    for (const text of texts) {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: { parts: [{ text }] },
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini Embedding API failed: ${response.status} - ${errorText}`);
      }

      const data = (await response.json()) as any;
      const values = data.embedding?.values;
      if (!values) {
        throw new Error('Empty embedding from Gemini API');
      }
      embeddings.push(values);
    }

    return {
      embeddings,
      provider: 'gemini',
    };
  }
}
