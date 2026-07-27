import { LogLineEval } from "./types/evals.js";
import { LogLine } from "@browserbasehq/stagehand";
import type { V3 } from "@browserbasehq/stagehand";
/**
 * EvalLogger:
 * A logger class used during evaluations to capture and print log lines.
 *
 * Capabilities:
 * - Maintains an internal array of log lines (EvalLogger.logs) for later retrieval.
 * - Can be initialized with a Stagehand instance to provide consistent logging.
 * - Supports logging at different levels (info, error, warn).
 * - Each log line is converted to a string and printed to console for immediate feedback.
 * - Also keeps a structured version of the logs that can be returned for analysis or
 *   included in evaluation output.
 */
export declare class EvalLogger {
    private logs;
    private echo;
    stagehand?: V3;
    constructor(echo?: boolean);
    /**
     * init:
     * Associates this logger with a given Stagehand instance.
     * This allows the logger to provide additional context if needed.
     */
    init(stagehand?: V3): void;
    /**
     * log:
     * Logs a message at the default (info) level.
     * Uses `logLineToString` to produce a readable output on the console,
     * and then stores the parsed log line in `this.logs`.
     */
    log(logLine: LogLine): void;
    /**
     * error:
     * Logs an error message with `console.error` and stores it.
     * Useful for capturing and differentiating error-level logs.
     */
    error(logLine: LogLine): void;
    /**
     * warn:
     * Logs a warning message with `console.warn` and stores it.
     * Helps differentiate warnings from regular info logs.
     */
    warn(logLine: LogLine): void;
    /**
     * getLogs:
     * Retrieves the array of stored log lines.
     * Useful for returning logs after a task completes, for analysis or debugging.
     */
    getLogs(): LogLineEval[];
    /**
     * clear:
     * Clears all stored logs to free memory.
     * Should be called after logs have been retrieved and processed.
     */
    clear(): void;
}
