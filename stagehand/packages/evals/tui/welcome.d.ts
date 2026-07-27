/**
 * Welcome panel + tip line.
 *
 * Two surfaces:
 *   - `printExtendedWelcome` — the one-time first-run panel. Shows banner-
 *     adjacent "what is this" copy, a health snapshot, and a quickstart.
 *     Gated by `isFirstRun(entryDir)` and `EVALS_NO_WELCOME`.
 *   - `printTipLine` — the small "Type help, .. to leave, exit · evals
 *     doctor for diagnostics" line that prints on every non-quiet launch.
 *     Previously hardcoded in banner.ts.
 *
 * No status row. The only inline output about env state is the zero-keys
 * warning surfaced via welcomeStatus.renderInlineWarning — printed by repl.ts
 * after the banner when no welcome is shown.
 */
import type { EnvSnapshot } from "./welcomeStatus.js";
import type { TaskRegistry } from "../framework/types.js";
export type WelcomeContext = {
    snapshot: EnvSnapshot;
    registry: TaskRegistry;
};
/**
 * The first-run panel. Prints to stdout. Does NOT include the discovery
 * count — that was removed; the task count is reachable via `evals list`
 * and `evals doctor`. Does NOT print the banner — repl.ts prints the
 * banner first and the welcome second.
 */
export declare function printExtendedWelcome(ctx: WelcomeContext): void;
/**
 * The compact tip line that prints on every non-quiet launch.
 * Replaces the line that used to live at banner.ts:19-21.
 */
export declare function printTipLine(): void;
