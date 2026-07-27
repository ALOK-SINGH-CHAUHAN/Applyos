/**
 * First-run welcome state.
 *
 * The marker (`_meta.firstRunCompletedAt`) lives inside `evals.config.json`
 * so it follows the same per-mode (source vs. dist) storage rules as the
 * rest of the config. This is intentional: a contributor switching between
 * `pnpm evals` and a globally installed CLI sees the welcome again — that's
 * acceptable and avoids a separate cross-install state location.
 *
 * `scripts/build-cli.ts` preserves `_meta` across rebuilds so the dist
 * config inherits the source marker on first build.
 */
import { type WelcomeMeta } from "./commands/config.js";
export declare const CURRENT_SCHEMA_VERSION = 1;
export declare function readWelcomeMeta(entryDir: string): WelcomeMeta;
export declare function isFirstRun(entryDir: string): boolean;
/**
 * Mark the first-run welcome as completed. Idempotent: re-runs don't change
 * the stored timestamp once set (avoids churn on every launch).
 */
export declare function markFirstRunComplete(entryDir: string): void;
