import type { EvaluationResult, Rubric, RubricVerifierOptions, TaskSpec, Trajectory, Verifier, VerifierConfig } from "./types.js";
/**
 * Resolve every verifier knob from env (+ optional overrides) into a frozen
 * VerifierConfig. Called once by RubricVerifier's constructor; per-call
 * overrides flow through verify()'s optional override arg.
 *
 * The master switch VERIFIER_DISABLE_TRUNCATION=1 lifts every per-section
 * limit to MAX_SAFE_INTEGER — useful on high-context models where
 * evidence-bound truncation is the bottleneck, not the token budget.
 */
export declare function resolveVerifierConfig(env?: NodeJS.ProcessEnv, overrides?: Partial<VerifierConfig>): VerifierConfig;
export declare class RubricVerifier implements Verifier {
    private readonly getClient;
    private readonly getRubricGenClient;
    private readonly logger;
    private readonly baseConfig;
    constructor(opts: RubricVerifierOptions);
    /** Resolved verifier knobs the constructor saw, frozen at construction. */
    get config(): VerifierConfig;
    verify(trajectory: Trajectory, overrides?: Partial<VerifierConfig>): Promise<EvaluationResult>;
    private emptyTrajectoryResult;
    private verifyOutcomeOnly;
    /**
     * Score every (evidence, criterion) pair with one batched call per chunk,
     * to avoid a per-(criterion, frame) fan-out. Failed batches contribute
     * all-zeros scores so the downstream top-K still produces valid groups.
     */
    private scoreRelevanceBatched;
    /**
     * One call per rubric criterion. Each call sees the criterion's top-K
     * evidence points (images + ariaTree snippets), the action history, and
     * the final answer; the response includes `earned_points` directly so the
     * process score is deterministic (Σ earned / Σ max).
     */
    private scorePerCriterion;
    /**
     * Single fused multimodal call returning the full EvaluationResult shape:
     * rubric + per-criterion top-K evidence + action history + final answer.
     * Optionally folds in first-point-of-failure and task-validity. Image
     * evidence rides inline; ariaTree text is embedded in the prompt under
     * each criterion's manifest section.
     */
    private fusedJudgment;
    /**
     * Consume the pre-scored rubric from scorePerCriterion and produce the
     * outcome result. When foldFailure/foldValidity are set, the response also
     * includes first-point-of-failure and task-validity, saving 1–2 extra
     * LLM calls.
     */
    private verifyOutcomeFused;
    /**
     * Flat per-step evidence summary — fallback for trajectories with no
     * probe screenshots, such as harness-adapter or stubbed trajectories.
     */
    private buildEvidenceContext;
    /**
     * Compact text evidence for the one-call outcome verifier.
     *
     * Outcome-only does not run the rubric relevance selector, but it still needs
     * enough saved-page text to avoid replacing trajectory facts with model
     * memory. Select a bounded set of lexically relevant and recent steps, then
     * include short excerpts around task/final-answer terms.
     */
    private buildOutcomeEvidenceSummary;
    /** Generate a rubric from the task description alone. */
    generateRubric(taskSpec: TaskSpec): Promise<Rubric>;
    /**
     * Identify all distinct failure points using taxonomy categories 1–6
     * (agent-controllable errors) and return the earliest one. Best-effort:
     * returns undefined on LLM failure / unparseable output / no failures
     * found, rather than blocking the rest of the pipeline.
     */
    private analyzeFailures;
    /**
     * Classify the task across ambiguity (taxonomy category 7) and
     * validity/feasibility (category 8). Pure task-level analysis; no
     * trajectory context needed. Best-effort: returns undefined on LLM error.
     */
    private classifyTaskValidity;
    /**
     * Format the rubric with per-criterion rescored points + explanations.
     * The outcome verifier reads this as advisory context — it sees how a
     * separate scoring system viewed each criterion but forms its own result.
     */
    private formatScoredRubricSummary;
    /**
     * Compact textual action history for embedding in prompts. One line per
     * step. Full per-step detail lives in trajectory.json on disk.
     */
    private formatActionHistory;
}
