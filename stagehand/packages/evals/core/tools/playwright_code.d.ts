import type { CoreCapability, CoreTool, StartupProfile, ToolStartInput, ToolStartResult } from "../contracts/tool.js";
import type { TargetKind } from "../contracts/targets.js";
export declare class PlaywrightCodeTool implements CoreTool {
    readonly id = "playwright_code";
    readonly surface = "code";
    readonly family = "playwright";
    readonly supportedStartupProfiles: StartupProfile[];
    readonly supportedCapabilities: CoreCapability[];
    readonly supportedTargetKinds: TargetKind[];
    start(input: ToolStartInput): Promise<ToolStartResult>;
}
