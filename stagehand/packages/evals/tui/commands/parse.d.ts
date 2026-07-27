/**
 * Shared argument parsing + option resolution for the evals CLI.
 *
 * Both the argv dispatch in cli.ts and the REPL tokenizer in repl.ts feed
 * tokens through parseRunArgs() here, and both resolve their final option
 * bundle through resolveRunOptions() — so flag semantics stay identical
 * regardless of entry point.
 *
 * Precedence (enforced by resolveRunOptions):
 *   1. CLI flags (highest)
 *   2. Benchmark shorthand derived overrides (b:/benchmark:<name>)
 *   3. STAGEHAND_BROWSER_TARGET (env-only fallback for --env)
 *   4. Config defaults (evals.config.json)
 *   5. Ambient EVAL_* env vars consumed downstream by runner/suites
 */
import { type Harness } from "../../framework/benchTypes.js";
import type { AgentToolMode } from "@browserbasehq/stagehand";
export interface RunFlags {
    target?: string;
    trials?: number;
    concurrency?: number;
    env?: string;
    model?: string;
    provider?: string;
    api?: boolean;
    tool?: string;
    startup?: string;
    harness?: string;
    agentMode?: string;
    agentModes?: AgentToolMode[];
    limit?: number;
    sample?: number;
    filter?: Array<[string, string]>;
    dryRun?: boolean;
    preview?: boolean;
    /**
     * Rubric success mode for the verifier — outcome | process | both.
     *   outcome (default): binary EvaluationResult.outcomeSuccess.
     *   process: EvaluationResult.processScore ≥ threshold.
     *   both: outcome AND process.
     * Plumbed to bench tasks via the EVAL_SUCCESS_MODE env override.
     */
    success?: SuccessMode;
    /** Spawn the pre-refactor index.eval.ts runner instead of the unified path. */
    legacy?: boolean;
}
export type SuccessMode = "outcome" | "process" | "both";
export interface ConfigDefaults {
    env?: string;
    trials?: number;
    concurrency?: number;
    provider?: string | null;
    model?: string | null;
    api?: boolean;
    verbose?: boolean | null;
    agentModes?: AgentToolMode[] | null;
}
export interface ResolvedRunOptions {
    target?: string;
    normalizedTarget?: string;
    trials: number;
    concurrency: number;
    environment: "LOCAL" | "BROWSERBASE";
    model?: string;
    provider?: string;
    useApi: boolean;
    coreToolSurface?: string;
    coreStartupProfile?: string;
    harness: Harness;
    agentMode?: AgentToolMode;
    agentModes?: AgentToolMode[];
    datasetFilter?: string;
    /** Rubric success mode forwarded to bench tasks via EVAL_SUCCESS_MODE. */
    successMode: SuccessMode;
    envOverrides: Record<string, string>;
    dryRun: boolean;
    preview: boolean;
    verbose: boolean;
}
export declare function parseAgentModes(raw: string): AgentToolMode[];
/**
 * Parse an argv or REPL-token stream into a RunFlags structure. The first
 * non-flag token becomes `target`; later positional args are rejected.
 */
export declare function parseRunArgs(tokens: string[]): RunFlags;
/**
 * Normalize a run target. Returns the target to hand to resolveTarget()
 * along with any env var overrides + datasetFilter needed for the
 * downstream runner / suites.
 *
 *   "all" → undefined (resolveTarget treats undefined as all bench tasks)
 *   "b:webvoyager" / "benchmark:webvoyager" → "agent/webvoyager" + EVAL_DATASET + EVAL_WEBVOYAGER_*
 *   other → passed through unchanged
 */
export declare function applyBenchmarkShorthand(target: string | undefined, flags: RunFlags): {
    target: string | undefined;
    datasetFilter?: string;
    envOverrides: Record<string, string>;
};
/**
 * Resolve RunFlags + config defaults + process.env into the final
 * ResolvedRunOptions bundle passed to runCommand. Applies precedence in a
 * single place so the order is greppable and testable.
 */
export interface CoreConfig {
    tool?: string;
    startup?: string;
}
export declare function resolveRunOptions(flags: RunFlags, defaults: ConfigDefaults, env: NodeJS.ProcessEnv, core?: CoreConfig): ResolvedRunOptions;
/**
 * Set env overrides for the duration of `fn` and restore prior values in
 * a `finally` block. Needed because the REPL is a long-lived process and
 * suites/*.ts read env vars directly — unscoped mutations would leak
 * between REPL commands.
 */
export declare function withEnvOverrides<T>(overrides: Record<string, string>, fn: () => Promise<T>): Promise<T>;
