/**
 * Command tree for the evals TUI.
 *
 * Models the user-visible command surface as a tree:
 *   root → run, list, new, config{path,set,reset,core{path,set,reset,setup}},
 *          experiments{list,show,open,compare}, verify, doctor
 *
 * Both the REPL (tui/repl.ts) and argv mode (cli.ts) build the same tree
 * via `buildCommandTree()` and dispatch user input through it. This is the
 * single source of truth for which commands exist and how they nest.
 *
 * Resolution rules (see resolveCommand):
 *   - Commands resolve relative to the current context (REPL contextPath).
 *   - The leading sigil `evals` strips itself and resolves the remainder
 *     from root — mirrors `evals X Y` from the shell.
 *   - Bare `evals` pops all context to root.
 *   - Meta commands (.., help, ?, exit/quit/q, clear, --help/-h) short-
 *     circuit before tree resolution and work at any depth.
 *
 * Existing handlers in tui/commands/* are wrapped, never rewritten.
 */
import type { TaskRegistry } from "../framework/types.js";
import { tokenize } from "./tokenize.js";
export type CommandHandler = (args: string[], ctx: CommandContext) => Promise<void> | void;
export type CommandNode = {
    /** Canonical lowercase name. */
    name: string;
    aliases?: readonly string[];
    summary: string;
    /** If present, executable as a leaf with the given args. */
    handler?: CommandHandler;
    /** If present, descendable as a namespace. */
    children?: readonly CommandNode[];
    /** Per-node help printer. Receives the absolute path that was resolved. */
    printHelp?: (subPath: readonly string[]) => void | Promise<void>;
    /** Hidden from auto-listings (still resolvable). */
    hidden?: boolean;
};
export type CommandContext = {
    entryDir: string;
    /** Lazy registry accessor — REPL caches, argv discovers on first call. */
    getRegistry: () => Promise<TaskRegistry>;
    setRegistry: (r: TaskRegistry) => void;
    /** Mutable in REPL (the run leaf assigns/clears); null in argv. */
    abortRef: {
        current: AbortController | null;
    } | null;
    /** Mutable string[] in REPL; null in argv. Mutated via the helpers below. */
    contextPath: string[] | null;
    pushContext?: (segment: string) => void;
    popContext?: () => void;
    setContextPath?: (path: readonly string[]) => void;
};
export type Resolution = {
    kind: "noop";
} | {
    kind: "meta";
    name: MetaName;
    args: string[];
} | {
    kind: "run";
    node: CommandNode;
    args: string[];
    absolutePath: string[];
} | {
    kind: "unknown";
    token: string;
    context: readonly string[];
};
export type MetaName = "back" | "to-root" | "exit" | "clear" | "help" | "help-q";
export declare function findChild(node: CommandNode, token: string): CommandNode | undefined;
export declare function walkPath(root: CommandNode, path: readonly string[]): CommandNode;
export declare function resolveCommand(root: CommandNode, contextPath: readonly string[], tokens: readonly string[]): Resolution;
export declare function renderPrompt(contextPath: readonly string[]): string;
export type DispatchOutcome = {
    kind: "noop";
} | {
    kind: "meta";
} | {
    kind: "help";
} | {
    kind: "ran";
    absolutePath: string[];
};
/**
 * Resolve `tokens` against the tree and execute the result. Caller owns
 * error handling and prompt reprinting.
 *
 * Returns an outcome the caller can inspect — cli.ts uses it to decide
 * whether the invocation counts as a "first use" for the welcome marker.
 */
export declare function dispatch(root: CommandNode, tokens: string[], ctx: CommandContext): Promise<DispatchOutcome>;
/**
 * Build the canonical command tree. The factory is parameter-less because
 * leaves close over the `CommandContext` they receive at dispatch time —
 * the same tree instance can serve REPL (with abortRef + contextPath) and
 * argv (both null) contexts.
 */
export declare function buildCommandTree(): CommandNode;
/**
 * Re-tokenize a shell-split argv array on `>` boundaries.
 *
 * The shell consumes unescaped `>` as a redirect, so users who want
 * `evals experiments > list` from a terminal must escape (`\>`) or quote
 * the chunk. Either way the `>` survives in argv and we split on it here.
 *
 * Caveat: a quoted arg containing `>` (e.g. `"foo > bar"`) will also be
 * split. That's fine for known subcommand surfaces — none of our targets
 * or option values legitimately contain `>` characters.
 */
export declare function tokenizeArgv(args: readonly string[]): string[];
export { tokenize };
