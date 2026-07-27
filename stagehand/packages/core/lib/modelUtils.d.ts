import { ClientOptions, ModelConfiguration } from "./v3/types/public/model.js";
/**
 * Sentinel model name that delegates model selection to the Stagehand API.
 * Only valid when running through the API (env: "BROWSERBASE" with
 * disableAPI: false); no local LLM client or provider API key is involved.
 */
export declare const AUTO_MODEL_NAME = "auto";
export declare function isAutoModel(model?: string | {
    modelName: string;
    [key: string]: unknown;
}): boolean;
export declare function extractModelName(model?: string | {
    modelName: string;
    [key: string]: unknown;
}): string | undefined;
export declare function splitModelName(model: string): {
    provider: string;
    modelName: string;
};
export declare function resolveModel(model: string | ModelConfiguration): {
    provider: string;
    modelName: string;
    clientOptions: ClientOptions;
    isCua: boolean;
};
