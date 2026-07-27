import type { TaskResult } from "./types.js";
export interface LoadedTaskDefinition {
    __taskDefinition: true;
    meta: unknown;
    fn: (ctx: unknown) => Promise<unknown>;
}
export type LegacyTaskFn = (ctx: unknown) => Promise<TaskResult>;
export interface LoadedTaskModule {
    definition?: LoadedTaskDefinition;
    legacyFn?: LegacyTaskFn;
}
export declare function loadTaskModuleFromPath(filePath: string, taskName: string): Promise<LoadedTaskModule>;
