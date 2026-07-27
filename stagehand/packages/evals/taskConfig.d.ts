/**
 * Task and model configuration.
 *
 * This module now builds the task registry from the filesystem (auto-discovery)
 * instead of reading a static tasks array from evals.config.json.
 * Model configuration logic is preserved as-is.
 */
import { type AvailableModel } from "@browserbasehq/stagehand";
import { AgentModelEntry } from "./types/evals.js";
type TaskConfig = {
    name: string;
    categories: string[];
};
declare const tasksConfig: TaskConfig[];
declare const tasksByName: Record<string, {
    categories: string[];
}>;
/**
 * Validate a specific eval name against the discovered tasks.
 * Called lazily (not at import time) to avoid side effects in bundled builds.
 */
export declare function validateEvalName(evalName: string): void;
declare const getModelList: (category?: string) => string[];
declare const MODELS: AvailableModel[];
declare const getAgentModelEntries: () => AgentModelEntry[];
export { tasksByName, MODELS, tasksConfig, getModelList, getAgentModelEntries };
export type { AgentModelEntry };
