/**
 * ANSI color palette and formatters for the evals TUI.
 *
 * Modeled after the agents dev-cli format.ts — hand-rolled ANSI codes,
 * no external dependency needed.
 */
export declare const c: {
    readonly reset: `${string}0m`;
    readonly bold: `${string}1m`;
    readonly dim: `${string}2m`;
    readonly italic: `${string}3m`;
    readonly underline: `${string}4m`;
    readonly red: `${string}31m`;
    readonly green: `${string}32m`;
    readonly yellow: `${string}33m`;
    readonly blue: `${string}34m`;
    readonly magenta: `${string}35m`;
    readonly cyan: `${string}36m`;
    readonly white: `${string}37m`;
    readonly gray: `${string}90m`;
    readonly bb: `${string}38;2;1;200;81m`;
    readonly bbBold: `${string}1m${string}38;2;1;200;81m`;
};
export declare function bold(s: string): string;
export declare function dim(s: string): string;
export declare function red(s: string): string;
export declare function green(s: string): string;
export declare function yellow(s: string): string;
export declare function blue(s: string): string;
export declare function cyan(s: string): string;
export declare function magenta(s: string): string;
export declare function gray(s: string): string;
export declare function bb(s: string): string;
export declare function bbBold(s: string): string;
export type TaskStatus = "pending" | "running" | "passed" | "failed" | "error";
export declare function statusBadge(status: TaskStatus): string;
export declare function padRight(s: string, width: number): string;
export declare function formatMs(ms: number): string;
export declare function header(text: string): string;
export declare function coolSilverHeader(text: string): string;
export declare function warmStoneHeader(text: string): string;
export declare function dustyCyanHeader(text: string): string;
export declare function stripAnsi(s: string): string;
export declare function visibleLength(s: string): number;
export declare function truncateText(s: string, width: number): string;
export declare function getTerminalWidth(fallback?: number): number;
export declare function separator(): string;
export declare function writeRaw(s: string): void;
export declare function writeLine(s?: string): void;
