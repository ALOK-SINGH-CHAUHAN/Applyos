import type { AvailableModel } from "@browserbasehq/stagehand";
import type { EvalLogger } from "../logger.js";
import type { TaskResult } from "./types.js";
import type { ExternalHarnessTaskPlan } from "./externalHarnessPlan.js";
import type { PreparedClaudeCodeToolAdapter } from "./claudeCodeToolAdapter.js";
import { type ExternalHarnessVerifierConfig } from "./verifierAdapter.js";
type ClaudeSdkMessage = Record<string, unknown>;
type ClaudeQuery = AsyncIterable<ClaudeSdkMessage>;
export type ClaudeAgentSdk = {
    query: (input: {
        prompt: string;
        options?: Record<string, unknown>;
    }) => ClaudeQuery;
};
export interface ClaudeCodeRunnerInput {
    plan: ExternalHarnessTaskPlan;
    model: AvailableModel;
    logger: EvalLogger;
    toolAdapter?: PreparedClaudeCodeToolAdapter;
    signal?: AbortSignal;
    sdk?: ClaudeAgentSdk;
    /**
     * Optional verifier integration. When provided, the runner builds a
     * Trajectory from the SDK message stream (via claudeCodeAdapter), runs
     * V3Evaluator.verify() against the trajectory's embedded TaskSpec, and folds
     * the EvaluationResult into the returned TaskResult ({_success} mode follows
     * EVAL_SUCCESS_MODE).
     * When omitted, the runner falls back to parsing the legacy EVAL_RESULT
     * line — preserves current behavior for callers that haven't migrated.
     */
    verifier?: ExternalHarnessVerifierConfig;
}
export interface ParsedClaudeCodeResult {
    success: boolean;
    summary?: string;
    finalAnswer?: string;
    raw: string;
}
export declare function normalizeClaudeCodeModel(model: AvailableModel): string;
export declare function buildClaudeCodePrompt(plan: ExternalHarnessTaskPlan, toolInstructions?: string): string;
export declare function parseClaudeCodeResult(raw: string): ParsedClaudeCodeResult;
export declare function isClaudeCodeMaxTurnsError(value: unknown): boolean;
export declare function runClaudeCodeAgent({ plan, model, logger, toolAdapter, signal, sdk: injectedSdk, verifier, }: ClaudeCodeRunnerInput): Promise<TaskResult>;
export {};
