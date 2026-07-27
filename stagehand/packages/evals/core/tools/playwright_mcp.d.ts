import type { TargetKind } from "../contracts/targets.js";
import type { CoreCapability, CoreTool, StartupProfile, ToolStartInput, ToolStartResult } from "../contracts/tool.js";
export declare class PlaywrightMcpTool implements CoreTool {
    readonly id = "playwright_mcp";
    readonly surface = "mcp";
    readonly family = "playwright";
    readonly supportedStartupProfiles: StartupProfile[];
    readonly supportedCapabilities: CoreCapability[];
    readonly supportedTargetKinds: TargetKind[];
    start(input: ToolStartInput): Promise<ToolStartResult>;
}
