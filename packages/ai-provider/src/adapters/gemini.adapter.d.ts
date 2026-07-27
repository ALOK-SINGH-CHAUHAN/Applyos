import { AIProvider, GenerateTextInput, GenerateTextOutput, EmbeddingInput, EmbeddingOutput } from '../ai-provider.interface';
export declare class GeminiProvider implements AIProvider {
    private readonly apiKey;
    name: string;
    supportsStructuredOutput: boolean;
    constructor(apiKey?: string);
    generateText(input: GenerateTextInput): Promise<GenerateTextOutput>;
    generateEmbedding(input: EmbeddingInput): Promise<EmbeddingOutput>;
}
