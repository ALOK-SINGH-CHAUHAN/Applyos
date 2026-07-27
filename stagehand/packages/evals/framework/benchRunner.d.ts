import type { EvalInput } from "../types/evals.js";
import type { DiscoveredTask, TaskResult } from "./types.js";
import type { RunEvalsOptions } from "./runner.js";
export declare function executeBenchTask(input: EvalInput, task: DiscoveredTask, options: RunEvalsOptions): Promise<TaskResult>;
