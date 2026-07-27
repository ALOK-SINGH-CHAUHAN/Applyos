/**
 * Formatted results table for post-run display.
 */
import type { SummaryResult } from "../types/evals.js";
export declare function printResultsTable(results: SummaryResult[]): void;
export declare function printModelSummary(results: SummaryResult[], leadingBlankLine?: boolean): void;
