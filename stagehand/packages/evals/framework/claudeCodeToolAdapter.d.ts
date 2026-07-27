import type { EvalLogger } from "../logger.js";
import type { StartupProfile, ToolSurface } from "../core/contracts/tool.js";
import { CdpConnection, type CdpEventMessage } from "../core/tools/cdp_code.js";
import type { ExternalHarnessTaskPlan } from "./externalHarnessPlan.js";
export interface ClaudeCodeToolAdapterInput {
    toolSurface?: ToolSurface;
    startupProfile?: StartupProfile;
    environment: "LOCAL" | "BROWSERBASE";
    plan: ExternalHarnessTaskPlan;
    logger: EvalLogger;
}
export interface PreparedClaudeCodeToolAdapter {
    toolSurface: ToolSurface;
    startupProfile: StartupProfile;
    cwd: string;
    env: Record<string, string>;
    allowedTools: string[];
    settingSources: string[];
    promptInstructions: string;
    mcpServers?: Record<string, unknown>;
    canUseTool?: (toolName: string, input: Record<string, unknown>) => Promise<Record<string, unknown>>;
    cleanup: () => Promise<void>;
}
export interface PreparedBrowseCliHarnessAdapter {
    toolSurface: "browse_cli";
    startupProfile: StartupProfile;
    cwd: string;
    env: Record<string, string>;
    promptInstructions: string;
    metadata: BrowseCliToolMetadata;
    cleanup: () => Promise<void>;
}
export interface BrowseCliHarnessAdapterInput {
    startupProfile: StartupProfile;
    environment: "LOCAL" | "BROWSERBASE";
    plan: ExternalHarnessTaskPlan;
    logger: EvalLogger;
    logCategory: string;
}
export interface BrowseCliToolMetadata {
    toolCommand: "browse";
    browseCliEntrypoint: string;
    browseCliVersion?: string;
}
export declare function getBrowseCliToolMetadata(): BrowseCliToolMetadata;
export declare function allowUnsandboxedLocalClaudeCode(): boolean;
export declare function getBrowseCliAllowedTools(): string[];
export declare function prepareClaudeCodeToolAdapter(input: ClaudeCodeToolAdapterInput): Promise<PreparedClaudeCodeToolAdapter>;
export declare function resolveClaudeCodeToolSurface(requested?: ToolSurface): ToolSurface;
export declare function resolveClaudeCodeStartupProfile(toolSurface: ToolSurface, environment: "LOCAL" | "BROWSERBASE", requested?: StartupProfile): StartupProfile;
export declare function prepareBrowseCliHarnessAdapter(input: BrowseCliHarnessAdapterInput): Promise<PreparedBrowseCliHarnessAdapter>;
export declare function waitForCdpEvent(connection: CdpConnection, sessionId: string, method: string, timeoutMs: number): Promise<CdpEventMessage>;
export declare function installBrowseSkill(cwd: string): Promise<void>;
export declare function insertAfterFrontmatter(markdown: string, addition: string): string;
export declare function isAllowedBrowseCommand(command: string): boolean;
