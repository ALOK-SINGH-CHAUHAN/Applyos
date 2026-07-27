import type { AgentToolMode, AvailableModel } from "@browserbasehq/stagehand";
import type { StartupProfile, ToolSurface } from "../core/contracts/tool.js";
export type Harness = "stagehand" | "claude_code" | "codex";
export declare const DEFAULT_BENCH_HARNESS: Harness;
export declare const SUPPORTED_BENCH_HARNESSES: readonly ["stagehand", "claude_code", "codex"];
export declare const EXECUTABLE_BENCH_HARNESSES: readonly ["stagehand", "claude_code", "codex"];
export declare function isBenchHarness(value: string): value is Harness;
export declare function isExecutableBenchHarness(value: Harness): boolean;
export declare function parseBenchHarness(value: string | undefined): Harness;
export type BenchTaskKind = "act" | "extract" | "observe" | "agent" | "combination" | "suite";
export interface StagehandHarnessConfig {
    harness: "stagehand";
    model: AvailableModel;
    provider?: string;
    environment: "LOCAL" | "BROWSERBASE";
    useApi: boolean;
    agentMode?: AgentToolMode;
    isCUA?: boolean;
    toolSurface?: ToolSurface;
    startupProfile?: StartupProfile;
    dataset?: string;
}
export interface ExternalHarnessConfig {
    model: AvailableModel;
    provider?: string;
    environment: "LOCAL" | "BROWSERBASE";
    useApi: boolean;
    toolSurface?: ToolSurface;
    startupProfile?: StartupProfile;
    dataset?: string;
}
export interface ClaudeCodeHarnessConfig extends ExternalHarnessConfig {
    harness: "claude_code";
}
export interface CodexHarnessConfig extends ExternalHarnessConfig {
    harness: "codex";
}
export type BenchHarnessConfig = StagehandHarnessConfig | ClaudeCodeHarnessConfig | CodexHarnessConfig;
export interface BenchMatrixRow {
    harness: Harness;
    task: string;
    category: string;
    taskKind: BenchTaskKind;
    model: AvailableModel;
    provider?: string;
    environment: "LOCAL" | "BROWSERBASE";
    useApi: boolean;
    toolSurface?: ToolSurface;
    startupProfile?: StartupProfile;
    trial: number;
    dataset?: string;
    params?: Record<string, unknown>;
    agentMode?: AgentToolMode;
    isCUA?: boolean;
    config: BenchHarnessConfig;
}
