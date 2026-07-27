import type { Command } from "@oclif/core";
import type { CommandFailureTelemetry } from "./errors.js";
type CliTelemetryErrorType = "oclif" | "runtime";
export declare function startTelemetryInvocation(startedAtMs?: number): void;
export declare function captureCommandInvoked(CommandClass: Command.Class, cliVersion: string): void;
export declare function recordCommandError(type: CliTelemetryErrorType, code: string | null, telemetry?: CommandFailureTelemetry): void;
export declare function captureCommandCompleted(cliVersion: string, error: Error | undefined): Promise<void>;
/**
 * Captures a `cli.command_not_found` event. Privacy: only the sanitized
 * attempted command id and the computed suggestion are sent — never raw argv,
 * which can contain URLs, selectors, or secrets.
 */
export declare function captureCommandNotFound(cliVersion: string, attemptedCommand: string | null, suggestedCommand: string | null): Promise<void>;
export {};
