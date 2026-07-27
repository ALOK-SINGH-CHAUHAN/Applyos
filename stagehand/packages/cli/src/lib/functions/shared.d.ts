export interface FunctionsApiConfig {
    apiKey: string;
    baseUrl: string;
}
export interface PollOptions<T> {
    done: (value: T) => boolean;
    intervalMs?: number;
    maxAttempts?: number;
}
export declare function resolveFunctionsApiConfig(args: {
    apiKey?: string;
    baseUrl?: string;
}): FunctionsApiConfig;
export declare function functionsRequest(config: FunctionsApiConfig, path: string, init?: RequestInit): Promise<Response>;
export declare function functionsGet<T>(config: FunctionsApiConfig, path: string): Promise<T>;
export declare function functionsPost<T>(config: FunctionsApiConfig, path: string, body: unknown): Promise<T>;
export declare function pollUntil<T>(loader: () => Promise<T>, options: PollOptions<T>): Promise<T>;
export declare function resolveEntrypoint(entrypoint: string): Promise<string>;
export declare function parseOptionalJsonValueArg(rawValue: unknown, label: string): unknown;
