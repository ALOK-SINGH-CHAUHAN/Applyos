/**
 * Shared tokenizer for the evals TUI.
 *
 * Splits a line into tokens on whitespace OR `>` (the context-traversal
 * separator). Inside single- or double-quoted strings, every character
 * including `>` is preserved literally — so quoted args like
 * `"foo>bar"` survive intact.
 *
 * Used by both the REPL (tui/repl.ts) and argv mode (cli.ts) so that
 * `evals experiments > list` behaves identically to `evals experiments list`
 * from the shell, and inside the REPL `experiments > list` is identical
 * to `experiments list`.
 */
export declare function tokenize(input: string): string[];
