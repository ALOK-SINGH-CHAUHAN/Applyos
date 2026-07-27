/**
 * Evals CLI entry point.
 *
 * Modes:
 *   - `evals` (no args)              → interactive REPL
 *   - `evals --quiet` / `evals -q`   → REPL with no banner / welcome / inline warnings
 *   - `evals run <target> …`         → single-shot run with rich progress
 *   - `evals list [tier]`            → list discovered tasks
 *   - `evals config [sub]`           → print / get / set defaults
 *   - `evals experiments [sub]`      → inspect / compare Braintrust runs
 *   - `evals doctor` / `health`      → env-key + config + discovery health report
 *   - `evals new <tier> <cat> <name>`→ scaffold a task file
 *   - `evals help` / `-h`            → help
 *
 * Env vars:
 *   - EVALS_NO_WELCOME=1             → suppress first-run welcome panel (REPL only)
 *
 * No child processes. All runs flow through framework/runEvals in-process.
 *
 * Build: packages/evals/cli.ts → dist/cli/cli.js via scripts/build-cli.ts.
 * The bundled file is the `"bin"` entry in package.json.
 */
import "./silence-warnings.js";
