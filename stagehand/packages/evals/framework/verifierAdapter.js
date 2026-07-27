import { V3Evaluator, normalizeRubric, } from "@browserbasehq/stagehand";
import { tracedSpan } from "./braintrust.js";
import { persistAdapterTrajectory } from "./harnesses/persistTrajectory.js";
import { RubricCache } from "./rubricCache.js";
import { TrajectoryRecorder } from "./trajectoryRecorder.js";
/**
 * Resolve a task's rubric — precomputed, cached, or freshly generated — inside
 * a `verifier.rubric` span. Single definition shared by the stagehand and
 * external-harness (claude_code/codex) paths so the logged `source` always
 * reflects what actually happened: a cache miss that generates is reported as
 * "generated", never "cached".
 */
export async function resolveRubricTraced(evaluator, { taskSpec, dataset, cacheRoot }) {
    return tracedSpan(async (span) => {
        let rubric;
        let source;
        const precomputed = normalizeRubric(taskSpec.precomputedRubric);
        if (precomputed) {
            rubric = precomputed;
            source = "precomputed";
        }
        else if (process.env.VERIFIER_DISABLE_RUBRIC_CACHE === "1") {
            rubric = await evaluator.generateRubric(taskSpec);
            source = "generated";
        }
        else {
            const cache = new RubricCache(cacheRoot ? { dataset, cacheRoot } : { dataset });
            const cached = await cache.read(taskSpec);
            if (cached) {
                rubric = cached;
                source = "cached";
            }
            else {
                rubric = await evaluator.generateRubric(taskSpec);
                await cache.write(taskSpec, rubric);
                source = "generated";
            }
        }
        span.log({
            output: {
                source,
                rubric,
            },
            metadata: {
                taskId: taskSpec.id,
                dataset,
                source,
                criterionCount: rubric.items.length,
            },
        });
        return { rubric, source };
    }, {
        name: "verifier.rubric",
        type: "eval",
        event: {
            input: {
                taskId: taskSpec.id,
                dataset,
                hasPrecomputedRubric: Boolean(taskSpec.precomputedRubric),
                cacheDisabled: process.env.VERIFIER_DISABLE_RUBRIC_CACHE === "1",
            },
        },
    });
}
/**
 * Run V3Evaluator.verify() inside a `verifier.verify` span with the standard
 * scores + evaluation metadata. Single definition shared by the stagehand and
 * external-harness (claude_code/codex) paths.
 */
export async function verifyTraced(evaluator, trajectory, meta) {
    return tracedSpan(async (span) => {
        const v = await evaluator.verify(trajectory);
        const rawSteps = asRecord(v.rawSteps);
        span.log({
            output: v,
            scores: {
                outcome: v.outcomeSuccess ? 1 : 0,
                process: v.processScore,
            },
            metadata: {
                taskId: meta.taskId,
                dataset: meta.dataset,
                stepCount: trajectory.steps.length,
                criterionCount: v.perCriterion?.length ?? 0,
                findingCount: v.findings?.length ?? 0,
                evidenceInsufficientCount: v.evidenceInsufficient?.length ?? 0,
                firstFailStep: v.firstPointOfFailure?.stepIndex,
                firstFailCode: v.firstPointOfFailure?.errorCode,
                isAmbiguous: v.taskValidity?.isAmbiguous,
                isInvalid: v.taskValidity?.isInvalid,
                ambiguityReason: v.taskValidity?.ambiguityReason,
                invalidReason: v.taskValidity?.invalidReason,
                primaryIntent: rawSteps?.primaryIntent,
                reasoning: rawSteps?.reasoning,
            },
        });
        return v;
    }, { name: "verifier.verify", type: "eval" });
}
/**
 * Grade an external-harness run with the rubric verifier and fold the verdict
 * into the TaskResult. Never throws: on any failure in the verifier path the
 * self-reported result is returned with `verifierError` set, so downstream
 * consumers can tell an ungraded run apart from a graded one.
 */
export async function gradeExternalTrajectory({ buildTrajectory, verifier, baseResult, errorMessage, category, logger, }) {
    try {
        const trajectory = buildTrajectory();
        const evaluator = new V3Evaluator(verifier.v3, { backend: "verifier" });
        // Hydrate rubric — use precomputed if present, otherwise cache-or-generate.
        const { rubric } = await resolveRubricTraced(evaluator, {
            taskSpec: verifier.taskSpec,
            dataset: verifier.dataset,
        });
        const hydratedSpec = {
            ...verifier.taskSpec,
            precomputedRubric: rubric,
        };
        const hydratedTrajectory = { ...trajectory, task: hydratedSpec };
        const evaluationResult = await verifyTraced(evaluator, hydratedTrajectory, {
            taskId: hydratedSpec.id,
            dataset: verifier.dataset,
        });
        const successMode = verifier.successMode ?? process.env.EVAL_SUCCESS_MODE;
        const verifiedSuccess = evaluationResultToSuccess(evaluationResult, successMode);
        const { directory: trajectoryDir } = await persistAdapterTrajectory({
            trajectory: hydratedTrajectory,
            taskSpec: hydratedSpec,
            evaluationResult,
            outputRoot: verifier.trajectoryRoot,
            runId: verifier.runId,
        });
        logger.log({
            category,
            message: `result: outcome=${evaluationResult.outcomeSuccess} process=${formatProcessScore(evaluationResult.processScore)} steps=${hydratedTrajectory.steps.length}`,
            level: 1,
        });
        return {
            ...baseResult,
            _success: verifiedSuccess,
            error: verifiedSuccess ? undefined : (baseResult.error ?? errorMessage),
            outcomeSuccess: evaluationResult.outcomeSuccess,
            processScore: evaluationResult.processScore,
            evidenceInsufficient: evaluationResult.evidenceInsufficient,
            criterionCount: rubric.items.length,
            stepCount: hydratedTrajectory.steps.length,
            trajectoryDir,
        };
    }
    catch (verifyError) {
        const message = stringifyVerifierError(verifyError);
        logger.warn({
            category,
            message: `verifier integration failed: ${message}`,
            level: 0,
            auxiliary: {
                error: { value: message, type: "string" },
            },
        });
        // Surface the failure on the result — `_success` falls back to the
        // agent's self-report, and downstream consumers must be able to tell
        // this run apart from one the verifier actually graded.
        return { ...baseResult, verifierError: message };
    }
}
function formatProcessScore(score) {
    return typeof score === "number" ? score.toFixed(2) : "n/a";
}
/** Always non-empty, so a set `verifierError` is reliably truthy downstream. */
function stringifyVerifierError(value) {
    if (value instanceof Error)
        return value.message || value.name || "Error";
    if (typeof value === "string")
        return value || "unknown verifier error";
    if (value != null) {
        try {
            const json = JSON.stringify(value);
            if (json)
                return json;
        }
        catch {
            // not serializable — fall through to String()
        }
        return String(value);
    }
    return "unknown verifier error";
}
export async function runWithVerifier(opts) {
    const { v3, agent, taskSpec, dataset, agentOptions, runId, trajectoryRoot } = opts;
    const evaluator = new V3Evaluator(v3, { backend: "verifier" });
    // ── Resolve rubric ──────────────────────────────────────────────────────
    const { rubric: resolvedRubric } = await resolveRubricTraced(evaluator, {
        taskSpec,
        dataset,
    });
    // Hand a fully-hydrated TaskSpec to the verifier so it doesn't regenerate.
    const hydratedTaskSpec = {
        ...taskSpec,
        precomputedRubric: resolvedRubric,
    };
    // ── Record trajectory around agent.execute() ───────────────────────────
    const recorder = new TrajectoryRecorder({
        taskSpec: hydratedTaskSpec,
        runId,
        outputRoot: trajectoryRoot,
    });
    const { callbacks: userCallbacks, ...restAgentOptions } = agentOptions ?? {};
    let agentResult;
    let recorderStatus = "complete";
    try {
        agentResult = await tracedSpan(async (span) => {
            const result = await agent.execute({
                ...restAgentOptions,
                instruction: taskSpec.instruction,
                callbacks: {
                    ...userCallbacks,
                    onEvidence: async (event) => {
                        recorder.record(event);
                        await userCallbacks?.onEvidence?.(event);
                    },
                },
            });
            span.log({
                output: { message: result.message?.slice(0, 500) },
                metrics: usageMetrics(result.usage),
            });
            return result;
        }, { name: "agent.execute", type: "task" });
    }
    catch (e) {
        recorderStatus = "error";
        // Re-throw after persisting so the bench task can decide how to report.
        const wrapped = e instanceof Error ? e : new Error(String(e));
        try {
            const trajectory = await recorder.finish({ status: recorderStatus });
            Object.assign(wrapped, { trajectoryDir: recorder.directory, trajectory });
        }
        catch {
            // Persistence failure must not mask the original agent error.
        }
        throw wrapped;
    }
    const trajectory = await recorder.finish({
        status: recorderStatus,
        finalAnswer: agentResult.message,
        usage: agentResult.usage,
    });
    // ── Verify ──────────────────────────────────────────────────────────────
    const evaluationResult = await verifyTraced(evaluator, trajectory, {
        taskId: taskSpec.id,
        dataset,
    });
    await recorder.persistResult(evaluationResult);
    return {
        trajectory,
        evaluationResult,
        agentResult,
        rubric: resolvedRubric,
        trajectoryDir: recorder.directory,
    };
}
function asRecord(value) {
    return value && typeof value === "object"
        ? value
        : undefined;
}
function usageMetrics(usage) {
    if (!usage)
        return {};
    return Object.fromEntries(Object.entries(usage).filter((e) => typeof e[1] === "number"));
}
export function resolveEvalSuccessMode(mode) {
    if (typeof mode !== "string")
        return "outcome";
    const normalized = mode.trim().toLowerCase();
    if (normalized === "outcome" ||
        normalized === "process" ||
        normalized === "both") {
        return normalized;
    }
    return "outcome";
}
export function evaluationResultToSuccess(result, mode = "outcome", processThreshold = 0.8) {
    const resolvedMode = resolveEvalSuccessMode(mode);
    const outcomeOk = result.outcomeSuccess;
    const processOk = typeof result.processScore === "number" &&
        result.processScore >= processThreshold;
    switch (resolvedMode) {
        case "outcome":
            return outcomeOk;
        case "process":
            return processOk;
        case "both":
            return outcomeOk && processOk;
    }
}
