import { connectToMCPServer } from "@browserbasehq/stagehand";
type McpTextContent = {
    type: "text";
    text: string;
};
type McpImageContent = {
    type: "image";
    data: string;
    mimeType?: string;
};
type McpEmbeddedResourceContent = {
    type: "resource";
    resource: {
        text?: string;
        uri?: string;
        mimeType?: string;
    } | undefined;
};
export type McpToolResult = {
    content?: Array<McpTextContent | McpImageContent | McpEmbeddedResourceContent>;
    isError?: boolean;
    structuredContent?: unknown;
};
export type McpClient = Awaited<ReturnType<typeof connectToMCPServer>>;
export interface StdioMcpConnectionOptions {
    command: string;
    args: string[];
    env?: Record<string, string | undefined>;
    artifactRootDir?: string;
}
export interface ParsedListedPage {
    toolPageId: number;
    url: string;
}
export declare function extractMcpText(result: McpToolResult): string;
export declare function extractMcpImage(result: McpToolResult): {
    data: string;
    mimeType?: string;
} | null;
export declare function parseLooseJson<T>(text: string): T;
export declare function parseChromeDevtoolsListedPages(text: string): ParsedListedPage[];
export declare function createPnpmDlxEnv(env?: Record<string, string | undefined>): Record<string, string>;
export declare function resolvePnpmCommand(): string;
export declare class StdioMcpRuntime {
    private readonly client;
    private readonly artifactDir;
    private constructor();
    static connect(options: StdioMcpConnectionOptions): Promise<StdioMcpRuntime>;
    callTool(toolName: string, args: Record<string, unknown>): Promise<McpToolResult>;
    callText(toolName: string, args: Record<string, unknown>): Promise<string>;
    callJson<T>(toolName: string, args: Record<string, unknown>): Promise<T>;
    artifactPath(filename: string): string;
    readArtifact(filename: string): Promise<Buffer>;
    readArtifactText(filename: string): Promise<string>;
    close(): Promise<void>;
}
export {};
