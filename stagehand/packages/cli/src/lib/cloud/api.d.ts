import Browserbase from "@browserbasehq/sdk";
export { outputJson } from "../output.js";
export type BrowserbaseApiCommand = "fetch" | "search" | "projects" | "contexts" | "extensions" | "functions" | "sessions";
export declare function resolveApiKey(args: {
    apiKey?: string;
}): string;
export declare function resolveBaseUrl(args: {
    baseUrl?: string;
}): string | undefined;
export declare function resolveApiBaseUrl(args: {
    baseUrl?: string;
}): string;
export declare function createBrowserbaseClient(args: {
    apiKey?: string;
    baseUrl?: string;
}): Browserbase;
export declare function withBrowserbaseApi<T>(command: BrowserbaseApiCommand, operation: () => Promise<T>): Promise<T>;
export declare function parseOptionalJsonObjectArg(rawValue: unknown, label: string): Record<string, unknown>;
export declare function resolveUploadableFile(filePath: string, label: string): Promise<import("fs").ReadStream>;
export declare function readBrowserbaseError(response: Response): Promise<string>;
export declare function requestBrowserbase(args: {
    apiKey?: string;
    baseUrl?: string;
}, pathname: string, init?: RequestInit): Promise<Response>;
export declare function requestBrowserbaseJson<T>(args: {
    apiKey?: string;
    baseUrl?: string;
}, pathname: string, init?: RequestInit): Promise<T>;
export declare function writeOutputFile(pathname: string, contents: string): Promise<void>;
export declare function writeBinaryOutput(pathname: string, contents: Uint8Array): Promise<void>;
export declare function readStdin(): Promise<string>;
export declare function resolveBody(options: {
    body?: string;
    stdin?: boolean;
}): Promise<Record<string, unknown>>;
export declare function deepMerge(base: Record<string, unknown>, override: Record<string, unknown>): Record<string, unknown>;
export declare function classifyCommandHttpFailure(command: BrowserbaseApiCommand, status: number | undefined): string | undefined;
