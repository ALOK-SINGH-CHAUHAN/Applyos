import type { EvalLogger } from "../logger.js";
import type { StartupProfile, ToolSurface } from "../core/contracts/tool.js";
import type { ExternalHarnessTaskPlan } from "./externalHarnessPlan.js";
import { type PreparedBrowseCliHarnessAdapter } from "./claudeCodeToolAdapter.js";
export interface CodexToolAdapterInput {
    toolSurface?: ToolSurface;
    startupProfile?: StartupProfile;
    environment: "LOCAL" | "BROWSERBASE";
    plan: ExternalHarnessTaskPlan;
    logger: EvalLogger;
}
export type PreparedCodexToolAdapter = PreparedBrowseCliHarnessAdapter;
export declare function prepareCodexToolAdapter(input: CodexToolAdapterInput): Promise<PreparedCodexToolAdapter>;
export declare function resolveCodexToolSurface(requested?: ToolSurface): ToolSurface;
export declare function resolveCodexStartupProfile(toolSurface: ToolSurface, environment: "LOCAL" | "BROWSERBASE", requested?: StartupProfile): StartupProfile;
