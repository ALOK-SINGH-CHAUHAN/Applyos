import type { DiscoveredTask, TaskRegistry } from "./types.js";
/**
 * Discover all tasks by scanning the filesystem.
 *
 * @param tasksRoot - Absolute path to the tasks/ directory
 * @param eager - If true, imports modules to read defineTask metadata.
 *                If false (default), only uses filesystem-based inference.
 */
export declare function discoverTasks(tasksRoot: string, eager?: boolean): Promise<TaskRegistry>;
/**
 * Resolve a CLI target string to a list of tasks.
 *
 * Target resolution order:
 *   1. Tier-qualified: "core:navigation" → tier=core, category=navigation
 *   2. Tier name: "core" → all tasks in that tier
 *   3. Category name: "act" → all tasks with that category (errors on ambiguity)
 *   4. Task name: "dropdown" → specific task by name
 *   5. No target: defaults to all bench tasks
 */
export declare function resolveTarget(registry: TaskRegistry, target?: string): DiscoveredTask[];
