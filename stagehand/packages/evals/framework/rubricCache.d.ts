import type { Rubric, TaskSpec } from "@browserbasehq/stagehand";
export interface RubricCacheOptions {
    /**
     * Root directory for cached rubrics. Defaults to
     * `<packages/evals>/.rubric-cache`.
     */
    cacheRoot?: string;
    /**
     * Dataset name, used as a subdirectory under cacheRoot to keep different
     * datasets' rubrics separate (e.g., "onlineMind2Web").
     */
    dataset: string;
}
export declare class RubricCache {
    private readonly cacheDir;
    constructor(opts: RubricCacheOptions);
    /** Read a cached rubric. Returns undefined on miss or cache-key drift. */
    read(taskSpec: TaskSpec): Promise<Rubric | undefined>;
    write(taskSpec: TaskSpec, rubric: Rubric): Promise<void>;
    /** Wipe the cache directory (used by tests / `bench cache clear`). */
    clear(): Promise<void>;
    private entryPath;
}
