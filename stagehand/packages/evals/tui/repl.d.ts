/**
 * Interactive REPL for the evals CLI.
 *
 * Shares all parsing + dispatch with the single-shot argv path in
 * cli.ts via tui/commandTree.ts and tui/commands/*.
 */
export type ReplOptions = {
    /** Suppress banner, welcome, and any inline warnings. Output is just the prompt. */
    quiet?: boolean;
};
export declare function startRepl(entryDir: string, options?: ReplOptions): Promise<void>;
