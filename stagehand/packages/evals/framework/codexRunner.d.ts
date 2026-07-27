import type { AvailableModel } from "@browserbasehq/stagehand";
import type { EvalLogger } from "../logger.js";
import type { TaskResult } from "./types.js";
import type { ExternalHarnessTaskPlan } from "./externalHarnessPlan.js";
import type { PreparedCodexToolAdapter } from "./codexToolAdapter.js";
import { type ExternalHarnessVerifierConfig } from "./verifierAdapter.js";
type CodexEvent = Record<string, unknown>;
export type CodexThread = {
    runStreamed: (input: string, options?: Record<string, unknown>) => Promise<{
        events: AsyncIterable<CodexEvent>;
    }>;
};
export type CodexSdk = {
    startThread: (options?: Record<string, unknown>) => CodexThread;
};
export interface CodexRunnerInput {
    plan: ExternalHarnessTaskPlan;
    model: AvailableModel;
    logger: EvalLogger;
    toolAdapter?: PreparedCodexToolAdapter;
    signal?: AbortSignal;
    sdk?: CodexSdk;
    /**
     * Optional verifier integration. When provided, the runner builds a
     * Trajectory from the codex event stream (via codexAdapter), runs
     * V3Evaluator.verify() against the trajectory's embedded TaskSpec, and folds
     * the EvaluationResult into the returned TaskResult ({_success} mode follows
     * EVAL_SUCCESS_MODE).
     * When omitted, the runner falls back to parsing the legacy JSON result —
     * preserves current behavior for callers that haven't migrated.
     */
    verifier?: ExternalHarnessVerifierConfig;
}
export interface ParsedCodexResult {
    success: boolean;
    summary?: string;
    finalAnswer?: string;
    raw: string;
}
export declare function normalizeCodexModel(model: AvailableModel): string;
export declare function buildCodexPrompt(plan: ExternalHarnessTaskPlan, toolInstructions?: string): string;
export declare function parseCodexResult(raw: string): ParsedCodexResult;
export declare function runCodexAgent({ plan, model, logger, toolAdapter, signal, sdk: injectedSdk, verifier, }: CodexRunnerInput): Promise<TaskResult>;
export {};
