/**
 * Run command — executes evals with live progress output.
 *
 * Takes a fully-resolved ResolvedRunOptions bundle from parse.ts; does not
 * re-apply precedence. Handles --dry-run (prints a deterministic JSON plan
 * and returns) and scopes env overrides per run so benchmark shorthand
 * values don't leak across REPL commands.
 */
import type { TaskRegistry } from "../../framework/types.js";
import type { ResolvedRunOptions } from "./parse.js";
import { type Harness } from "../../framework/benchTypes.js";
export declare function runCommand(options: ResolvedRunOptions, registry?: TaskRegistry, signal?: AbortSignal): Promise<void>;
export declare function deriveCategoryFilter(registry: TaskRegistry, normalizedTarget?: string): string | undefined;
export declare function canExecuteBenchHarness(harness: Harness): boolean;
