import type { StartupProfile, ToolSurface } from "../contracts/tool.js";
export interface PreparedCoreBrowserTarget {
    providedEndpoint?: {
        kind: "ws" | "http";
        url: string;
        headers?: Record<string, string>;
    };
    metadata?: Record<string, unknown>;
    cleanup: () => Promise<void>;
}
export declare function prepareCoreBrowserTarget(input: {
    environment: "LOCAL" | "BROWSERBASE";
    toolSurface: ToolSurface;
    startupProfile: StartupProfile;
}): Promise<PreparedCoreBrowserTarget>;
