import type { AgentToolMode, AvailableModel } from "@browserbasehq/stagehand";
import { type AgentModelEntry } from "../taskConfig.js";
import type { Testcase } from "../types/evals.js";
import type { StartupProfile, ToolSurface } from "../core/contracts/tool.js";
import type { DiscoveredTask } from "./types.js";
import { type BenchMatrixRow, type BenchTaskKind, type Harness } from "./benchTypes.js";
export interface BenchPlanOptions {
    environment?: "LOCAL" | "BROWSERBASE";
    useApi?: boolean;
    modelOverride?: string;
    provider?: string;
    categoryFilter?: string;
    datasetFilter?: string;
    agentMode?: AgentToolMode;
    agentModes?: AgentToolMode[];
    harness?: Harness;
    coreToolSurface?: ToolSurface;
    coreStartupProfile?: StartupProfile;
}
export interface BenchModelResolution {
    effectiveCategory: string | null;
    isAgentCategory: boolean;
    modelEntries: AgentModelEntry[];
}
export interface SuiteTestcaseResult {
    testcases: Testcase[];
    remainingTasks: DiscoveredTask[];
}
export declare function inferEffectiveBenchCategory(benchTasks: DiscoveredTask[], categoryFilter?: string | null): string | null;
export declare function resolveBenchModelEntries(benchTasks: DiscoveredTask[], options: Pick<BenchPlanOptions, "categoryFilter" | "modelOverride" | "agentMode" | "agentModes" | "harness">): BenchModelResolution;
export declare function inferBenchTaskKind(task: DiscoveredTask): BenchTaskKind;
export declare function buildBenchMatrixRow(task: DiscoveredTask, modelName: AvailableModel, options: BenchPlanOptions, params?: Record<string, unknown>, isCUA?: boolean, agentMode?: AgentToolMode): BenchMatrixRow;
export declare function generateBenchTestcases(benchTasks: DiscoveredTask[], options: BenchPlanOptions): Testcase[];
export declare function generateSuiteTestcases(benchTasks: DiscoveredTask[], options: BenchPlanOptions, modelEntries: AgentModelEntry[]): SuiteTestcaseResult;
