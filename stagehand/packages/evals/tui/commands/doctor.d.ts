/**
 * `evals doctor` — on-demand health report.
 *
 * The single canonical surface for env-key status. Replaces what earlier
 * drafts proposed as an always-on status row in the REPL; the REPL itself
 * only emits a single inline line when zero provider keys are present
 * (see tui/welcomeStatus.ts).
 *
 * Sections:
 *   1. Runtime    — node version, Stagehand version, mode (source/dist)
 *   2. Config     — evals.config.json path, defaults.env/trials/concurrency, core.*
 *   3. Discovery  — total tasks + core/bench split
 *   4. API keys   — full matrix from snapshotEnv() with source provenance
 *   5. Verdict    — ok | warn | fail; exit code 0 | 0 | 1 (sans --json)
 *
 * Flags:
 *   --json     machine-readable output, always exit 0
 *   --help/-h  prints printDoctorHelp()
 *   --probe    HIDDEN. Issues a tiny no-op LLM call to verify the OpenAI key
 *              actually works. Used in CI; not advertised in --help.
 */
export declare function printDoctorHelp(): void;
export declare function handleDoctor(args: string[], entryDir: string): Promise<number>;
