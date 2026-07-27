import type { EvalInput } from "../types/evals.js";
export interface ExternalHarnessTaskPlan {
    dataset: "webvoyager" | "onlineMind2Web" | "webtailbench" | "odysseysbench";
    taskId?: string;
    startUrl: string;
    instruction: string;
}
export declare function buildExternalHarnessTaskPlan(input: EvalInput): ExternalHarnessTaskPlan;
