/**
 * `evals config core` — configuration for the core (deterministic) tier's
 * tool adapter defaults. Namespaced under `config` so it lives beside run
 * defaults.
 *
 * Subcommands (what this module sees after `config core` is stripped):
 *   (none)                print current core section
 *   path                  print the config file path
 *   set <k> <v>           set tool or startup
 *   reset [key]           reset one key or the whole core section
 *   setup                 (placeholder — interactive wizard TODO)
 *
 * Scope is intentionally narrow: only `tool` and `startup` persist. Native
 * adapter options stay in code / env vars. Per-task overrides are not
 * supported — config applies globally to every core run.
 *
 * Validation uses the live adapter registry so `set startup` can only
 * accept values the currently-configured tool actually supports.
 */
export declare function handleCore(args: string[], entryDir: string): Promise<void>;
export declare function printCoreConfig(entryDir: string): void;
