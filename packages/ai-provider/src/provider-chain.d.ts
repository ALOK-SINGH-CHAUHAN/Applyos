import { AIProvider, GenerateTextInput, GenerateTextOutput, EmbeddingInput, EmbeddingOutput } from './ai-provider.interface';
export declare class AllProvidersFailedError extends Error {
    readonly lastError: unknown;
    constructor(lastError: unknown);
}
export declare class ProviderChain implements AIProvider {
    private providers;
    name: string;
    supportsStructuredOutput: boolean;
    constructor(providers: AIProvider[]);
    generateText(input: GenerateTextInput): Promise<GenerateTextOutput>;
    generateEmbedding(input: EmbeddingInput): Promise<EmbeddingOutput>;
}
