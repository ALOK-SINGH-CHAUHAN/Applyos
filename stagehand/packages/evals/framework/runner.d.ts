import type { AgentToolMode } from "@browserbasehq/stagehand";
import type { StartupProfile, ToolSurface } from "../core/contracts/tool.js";
import type { DiscoveredTask, TaskRegistry } from "./types.js";
import type { EvalInput } from "../types/evals.js";
import { type Harness } from "./benchTypes.js";
export { discoverTasks, resolveTarget } from "./discovery.js";
export { inferEffectiveBenchCategory, resolveBenchModelEntries, } from "./benchPlanner.js";
export type { Harness } from "./benchTypes.js";
export { cleanupActiveRunResources } from "./activeRunCleanup.js";
export interface RunProgressEvent {
    type: "planned" | "started" | "passed" | "failed" | "error";
    taskName?: string;
    modelName?: string;
    durationMs?: number;
    error?: string;
    total?: number;
}
export interface RunEvalsOptions {
    tasks: DiscoveredTask[];
    registry: TaskRegistry;
    concurrency?: number;
    trials?: number;
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
    onProgress?: (event: RunProgressEvent) => void;
    verbose?: boolean;
    /**
     * Cooperative abort. When triggered, the runner short-circuits any
     * unstarted testcases and any in-flight bench task is asked to close
     * its V3 instance early via `addEventListener('abort', …)`. The reason
     * passed to `controller.abort(reason)` is read as one of:
     *   - "cooperative" (default) — let in-flight tasks finish their current step
     *   - "aggressive" — close V3 sessions immediately to force a throw
     */
    signal?: AbortSignal;
}
export interface RunEvalsResult {
    experimentName: string;
    summary: {
        passed: number;
        failed: number;
        total: number;
    };
    results: Array<{
        input: EvalInput;
        output: {
            _success: boolean;
            [key: string]: unknown;
        };
        name: string;
        score: number;
    }>;
}
export declare function runEvals(options: RunEvalsOptions): Promise<RunEvalsResult>;
