import type { CoreTool, CoreCapability, StartupProfile, ToolStartInput, ToolStartResult } from "../contracts/tool.js";
import type { TargetKind } from "../contracts/targets.js";
export declare class UnderstudyCodeTool implements CoreTool {
    readonly id = "understudy_code";
    readonly surface = "code";
    readonly family = "understudy";
    readonly supportedStartupProfiles: StartupProfile[];
    readonly supportedCapabilities: CoreCapability[];
    readonly supportedTargetKinds: TargetKind[];
    start(input: ToolStartInput): Promise<ToolStartResult>;
}
