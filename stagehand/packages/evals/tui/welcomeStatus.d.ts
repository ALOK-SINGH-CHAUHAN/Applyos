/**
 * Environment snapshot + inline warning rendering.
 *
 * Used by:
 *   - the one-time first-run welcome panel (`welcome.ts`)
 *   - `evals doctor`
 *   - the REPL's zero-keys inline warning (only inline output about env state)
 *
 * The single canonical view of which API keys are present, with source
 * provenance for the doctor's JSON output. The renderInlineWarning function
 * is intentionally narrow — it returns non-null ONLY when zero provider keys
 * are present, so the daily REPL stays quiet. Adding more inline cases here
 * is a deliberate policy change, not a code edit.
 */
export type KeyState = "set" | "missing";
export type KeySource = "process-env" | "package-dotenv" | "none";
export type ProviderKeyEntry = {
    state: KeyState;
    source: KeySource;
};
export type GoogleKeyEntry = ProviderKeyEntry & {
    /** Which env var actually held the value, or null if missing. */
    var: "GOOGLE_GENERATIVE_AI_API_KEY" | "GEMINI_API_KEY" | null;
};
export type BrowserbaseKeyEntry = {
    apiKey: KeyState;
    projectId: KeyState;
    /** True if only the BB_* alias variants are present (not the canonical names). */
    viaAlias: boolean;
};
export type EnvSnapshot = {
    openai: ProviderKeyEntry;
    anthropic: ProviderKeyEntry;
    google: GoogleKeyEntry;
    browserbase: BrowserbaseKeyEntry;
    braintrust: ProviderKeyEntry;
};
/**
 * Resolve a single env var, checking process.env first then the package .env.
 * Returns the value + which source it came from.
 *
 * Exported so callers that need the actual value (e.g. the doctor's
 * `--probe` flag) can use the same resolution as `snapshotEnv()`. The
 * snapshot itself intentionally exposes only `state` + `source`, not the
 * value — exposing raw key material via the doctor JSON would be a leak.
 */
export declare function resolveKey(name: string): {
    value: string;
    source: KeySource;
};
/**
 * Read process.env + packages/evals/.env into a single snapshot.
 * Pure modulo the cached dotenv read; safe to call repeatedly.
 */
export declare function snapshotEnv(): EnvSnapshot;
export declare function hasZeroProviderKeys(s: EnvSnapshot): boolean;
export declare function renderInlineWarning(s: EnvSnapshot): string | null;
/**
 * Internal helper exported for tests so the cached dotenv can be reset.
 */
export declare function __resetPackageEnvCacheForTests(): void;
