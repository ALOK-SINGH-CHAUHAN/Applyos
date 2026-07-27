/**
 * ASCII art banner for REPL mode.
 *
 * Pure ASCII output — the tip line that used to live here is now
 * `printTipLine()` in tui/welcome.ts so the REPL can choose between
 * "extended welcome" (first-run) and "banner + tip" (returning user).
 */
export declare function printBanner(): void;
