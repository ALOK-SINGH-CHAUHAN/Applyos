import { V3Evaluator, type AgentInstance, type AgentExecuteOptions, type AgentResult, type EvaluationResult, type Rubric, type TaskSpec, type Trajectory, type V3 } from "@browserbasehq/stagehand";
import type { EvalLogger } from "../logger.js";
import type { TaskResult } from "./types.js";
export interface RunWithVerifierOptions {
    v3: V3;
    agent: AgentInstance;
    taskSpec: TaskSpec;
    /**
     * Dataset name for rubric cache partitioning. Each task lives under
     * `.rubric-cache/<dataset>/<task-id>.json`.
     */
    dataset: string;
    /** Agent execute options. `instruction` is filled from taskSpec.instruction. */
    agentOptions?: Omit<AgentExecuteOptions, "instruction">;
    /** Override the run id (defaults to ISO timestamp). */
    runId?: string;
    /** Override trajectory persistence root. */
    trajectoryRoot?: string;
}
export interface RunWithVerifierResult {
    trajectory: Trajectory;
    evaluationResult: EvaluationResult;
    agentResult: AgentResult;
    /** Resolved rubric (precomputed, cached, or freshly generated). */
    rubric: Rubric;
    /** Where the trajectory was persisted (or would have been, if disabled). */
    trajectoryDir: string;
}
/** Where a task's resolved rubric came from. */
export type RubricSource = "precomputed" | "cached" | "generated";
export interface ResolveRubricTracedOptions {
    taskSpec: TaskSpec;
    dataset: string;
    /** Override the rubric cache root (tests). */
    cacheRoot?: string;
}
/**
 * Resolve a task's rubric — precomputed, cached, or freshly generated — inside
 * a `verifier.rubric` span. Single definition shared by the stagehand and
 * external-harness (claude_code/codex) paths so the logged `source` always
 * reflects what actually happened: a cache miss that generates is reported as
 * "generated", never "cached".
 */
export declare function resolveRubricTraced(evaluator: Pick<V3Evaluator, "generateRubric">, { taskSpec, dataset, cacheRoot }: ResolveRubricTracedOptions): Promise<{
    rubric: Rubric;
    source: RubricSource;
}>;
/**
 * Run V3Evaluator.verify() inside a `verifier.verify` span with the standard
 * scores + evaluation metadata. Single definition shared by the stagehand and
 * external-harness (claude_code/codex) paths.
 */
export declare function verifyTraced(evaluator: Pick<V3Evaluator, "verify">, trajectory: Trajectory, meta: {
    taskId: string;
    dataset: string;
}): Promise<EvaluationResult>;
/**
 * Verifier wiring for an external-harness runner (claude_code / codex). The
 * runner's only job is turning its event stream into a Trajectory; everything
 * else — evaluator construction, rubric hydration, verification, persistence,
 * and folding the verdict into the TaskResult — is harness-agnostic and lives
 * in {@link gradeExternalTrajectory}.
 */
export interface ExternalHarnessVerifierConfig {
    /**
     * V3 instance used solely as the LLM-client carrier for V3Evaluator. The
     * instance does NOT need to have `init()` been called — V3Evaluator.verify()
     * uses only `v3.logger` to construct its LLMProvider.
     */
    v3: V3;
    /** TaskSpec to verify against. id + instruction + optional rubric/initUrl. */
    taskSpec: TaskSpec;
    /** Dataset name for rubric cache partitioning (used when no precomputedRubric). */
    dataset: string;
    /** Override --success mode. Defaults to EVAL_SUCCESS_MODE env or "outcome". */
    successMode?: EvalSuccessMode;
    /** Override trajectory persistence root. */
    trajectoryRoot?: string;
    /** Override the run id (defaults to ISO timestamp). */
    runId?: string;
}
export interface GradeExternalTrajectoryOptions {
    /** Builds the harness-specific Trajectory; runs inside the guarded block. */
    buildTrajectory: () => Trajectory;
    verifier: ExternalHarnessVerifierConfig;
    /** The agent's self-reported result to fold the verdict into. */
    baseResult: TaskResult;
    /** Error message for a run the verifier grades as unsuccessful. */
    errorMessage: string;
    /** Logger category ("claude_code" | "codex"). */
    category: string;
    logger: EvalLogger;
}
/**
 * Grade an external-harness run with the rubric verifier and fold the verdict
 * into the TaskResult. Never throws: on any failure in the verifier path the
 * self-reported result is returned with `verifierError` set, so downstream
 * consumers can tell an ungraded run apart from a graded one.
 */
export declare function gradeExternalTrajectory({ buildTrajectory, verifier, baseResult, errorMessage, category, logger, }: GradeExternalTrajectoryOptions): Promise<TaskResult>;
export declare function runWithVerifier(opts: RunWithVerifierOptions): Promise<RunWithVerifierResult>;
/**
 * Decide bench task success from an EvaluationResult using the --success flag's
 * semantics.
 *
 * `outcome` (default) — strict binary outcome.
 * `process`           — rubric process score ≥ threshold (default 0.8).
 * `both`              — both conditions must hold.
 */
export type EvalSuccessMode = "outcome" | "process" | "both";
export declare function resolveEvalSuccessMode(mode: unknown): EvalSuccessMode;
export declare function evaluationResultToSuccess(result: EvaluationResult, mode?: unknown, processThreshold?: number): boolean;
