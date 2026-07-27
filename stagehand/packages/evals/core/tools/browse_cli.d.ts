import type { TargetKind } from "../contracts/targets.js";
import type { CoreCapability, CoreTool, StartupProfile, ToolStartInput, ToolStartResult } from "../contracts/tool.js";
export declare class BrowseCliTool implements CoreTool {
    readonly id = "browse_cli";
    readonly surface = "cli";
    readonly family = "stagehand_cli";
    readonly supportedStartupProfiles: StartupProfile[];
    readonly supportedCapabilities: CoreCapability[];
    readonly supportedTargetKinds: TargetKind[];
    start(input: ToolStartInput): Promise<ToolStartResult>;
}
