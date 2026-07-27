import type { LanguageModelV2 } from "@ai-sdk/provider";
import { ChatCompletion } from "openai/resources";
import { ClientOptions, CreateChatCompletionOptions, LLMClient, LogLine } from "@browserbasehq/stagehand";
export declare class AISdkClientWrapped extends LLMClient {
    type: "aisdk";
    private model;
    private logger?;
    constructor({ model, logger, clientOptions, }: {
        model: LanguageModelV2;
        logger?: (message: LogLine) => void;
        clientOptions?: ClientOptions;
    });
    getLanguageModel(): LanguageModelV2;
    createChatCompletion<T = ChatCompletion>({ options, }: CreateChatCompletionOptions): Promise<T>;
}
