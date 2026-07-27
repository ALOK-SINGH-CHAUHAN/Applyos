import type { TargetKind } from "../contracts/targets.js";
import type { CoreCapability, CoreTool, StartupProfile, ToolStartInput, ToolStartResult } from "../contracts/tool.js";
export declare class ChromeDevtoolsMcpTool implements CoreTool {
    readonly id = "chrome_devtools_mcp";
    readonly surface = "mcp";
    readonly family = "chrome_devtools";
    readonly supportedStartupProfiles: StartupProfile[];
    readonly supportedCapabilities: CoreCapability[];
    readonly supportedTargetKinds: TargetKind[];
    start(input: ToolStartInput): Promise<ToolStartResult>;
}
