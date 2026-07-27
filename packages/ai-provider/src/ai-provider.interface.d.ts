export interface GenerateTextInput {
    systemPrompt: string;
    messages: {
        role: 'user' | 'assistant';
        content: string;
    }[];
    responseFormat?: 'text' | 'json';
    maxTokens?: number;
}
export interface GenerateTextOutput {
    text: string;
    provider: string;
    usage?: {
        promptTokens?: number;
        completionTokens?: number;
    };
}
export interface EmbeddingInput {
    text: string | string[];
}
export interface EmbeddingOutput {
    embeddings: number[][];
    provider: string;
}
export interface AIProvider {
    name: string;
    generateText(input: GenerateTextInput): Promise<GenerateTextOutput>;
    generateEmbedding(input: EmbeddingInput): Promise<EmbeddingOutput>;
    supportsStructuredOutput: boolean;
}
