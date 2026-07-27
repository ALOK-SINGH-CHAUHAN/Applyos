import { V3, type AgentInstance } from "@browserbasehq/stagehand";
import type { EvalLogger } from "../logger.js";
import type { EvalInput } from "../types/evals.js";
import type { DiscoveredTask, TaskResult } from "./types.js";
import type { BenchMatrixRow, BenchTaskKind, Harness } from "./benchTypes.js";
type Page = ReturnType<V3["context"]["pages"]>[number];
export interface BenchHarnessStartInput {
    task: DiscoveredTask;
    input: EvalInput;
    row: BenchMatrixRow;
    logger: EvalLogger;
    verbose?: boolean;
}
export interface BenchHarnessExecuteInput extends BenchHarnessStartInput {
    signal?: AbortSignal;
}
export interface BenchHarnessContext {
    harness: Harness;
    row: BenchMatrixRow;
    logger: EvalLogger;
    v3?: V3;
    agent?: AgentInstance;
    page?: Page;
    debugUrl: string;
    sessionUrl: string;
}
export interface StartedBenchHarness {
    ctx: BenchHarnessContext;
    cleanup: () => Promise<void>;
}
export interface BenchHarness {
    harness: Harness;
    supportedTaskKinds: BenchTaskKind[];
    supportsApi: boolean;
    execute?(input: BenchHarnessExecuteInput): Promise<TaskResult>;
    start(input: BenchHarnessStartInput): Promise<StartedBenchHarness>;
}
export declare const stagehandHarness: BenchHarness;
export declare const claudeCodeHarness: BenchHarness;
export declare const codexHarness: BenchHarness;
export declare function getBenchHarness(harness: Harness): BenchHarness;
export {};
