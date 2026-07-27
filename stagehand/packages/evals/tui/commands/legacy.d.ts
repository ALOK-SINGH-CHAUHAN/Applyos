/**
 * Legacy escape hatch — spawns the pre-refactor `index.eval.ts` runner
 * instead of going through the unified in-process path.
 *
 * Opted into via `evals run <target> --legacy`. All env translation is
 * inherited from ResolvedRunOptions.envOverrides, so the spawned process
 * sees the same EVAL_* vars the unified path uses. Exit code of the child
 * becomes the exit code of this process. SIGINT/SIGTERM are forwarded.
 *
 * Only reachable from the argv dispatch in cli.ts — the REPL doesn't wire
 * --legacy because spawning a child that owns stdio mid-REPL is
 * disorienting.
 */
import type { ResolvedRunOptions, RunFlags } from "./parse.js";
import type { TaskRegistry } from "../../framework/types.js";
export declare function runLegacy(resolved: ResolvedRunOptions, flags: RunFlags, registry: TaskRegistry): Promise<never>;
