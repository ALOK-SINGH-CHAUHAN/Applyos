import type { V3 } from "../../v3.js";
import type { AgentModelConfig } from "../../types/public/agent.js";
export declare const extractTool: (v3: V3, executionModel?: string | AgentModelConfig, toolTimeout?: number) => import("ai").Tool<{
    instruction: string;
    schema?: {
        [x: string]: unknown;
        type?: string | undefined;
        properties?: Record<string, unknown> | undefined;
        items?: unknown;
        enum?: string[] | undefined;
        format?: "url" | "email" | "uuid" | undefined;
    } | undefined;
}, {
    success: boolean;
    result: any;
    error?: undefined;
} | {
    success: boolean;
    error: any;
    result?: undefined;
}>;
