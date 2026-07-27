/**
 * Config command — read/write `evals.config.json`.
 *
 * The config file lives in the same directory as the running module:
 *   - Source mode (tsx packages/evals/cli.ts): packages/evals/evals.config.json
 *   - Built mode (dist/cli/cli.js):            packages/evals/dist/cli/evals.config.json
 *
 * `scripts/build-cli.ts` seeds the dist copy from source on build and
 * preserves user-set `defaults` across rebuilds — so per-mode storage is
 * intentional, not a bug.
 *
 * The `entryDir` is computed via `getCurrentDirPath()` at the top of
 * `cli.ts` (the entry) and passed down so this module stays side-effect
 * free.
 */
import type { AgentToolMode } from "@browserbasehq/stagehand";
type Defaults = {
    env?: string | null;
    trials?: number | null;
    concurrency?: number | null;
    provider?: string | null;
    model?: string | null;
    api?: boolean | null;
    verbose?: boolean | null;
    agentModes?: AgentToolMode[] | null;
};
export type CoreConfigSection = {
    tool?: string;
    startup?: string;
};
/**
 * First-run / welcome metadata. Persisted inside `evals.config.json` so it
 * follows the same per-mode (source vs. dist) storage as `defaults`/`core`.
 * Owned by tui/welcomeState.ts; the type lives here because it round-trips
 * through readConfig/writeConfig.
 */
export type WelcomeMeta = {
    /** ISO 8601 timestamp when the first-run welcome was completed. */
    firstRunCompletedAt?: string;
    /** Schema version for the welcome marker (currently 1). */
    version?: number;
};
export type ConfigFile = {
    defaults: Defaults;
    benchmarks?: Record<string, unknown>;
    core?: CoreConfigSection;
    _meta?: WelcomeMeta;
};
export declare function resolveConfigPath(entryDir: string): string;
export declare function readConfig(entryDir: string): ConfigFile;
export declare function writeConfig(entryDir: string, config: ConfigFile): void;
export declare function printConfig(entryDir: string): void;
export declare function handleConfig(args: string[], entryDir: string): Promise<void>;
export {};
