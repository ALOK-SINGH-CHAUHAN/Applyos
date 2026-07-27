import { LLMProvider } from "./v3/llm/LLMProvider.js";
import { StagehandInvalidArgumentError } from "./v3/types/public/sdkErrors.js";
import { LegacyV3Evaluator } from "./v3LegacyEvaluator.js";
import { RubricVerifier } from "./v3/verifier/rubricVerifier.js";
const EVALUATOR_BACKEND_ENV = "STAGEHAND_EVALUATOR_BACKEND";
const DEFAULT_EVALUATOR_BACKEND = "legacy";
export class V3Evaluator {
    v3;
    backend;
    modelName;
    modelClientOptions;
    legacyEvaluator;
    constructor(v3, modelNameOrOptions, modelClientOptions, options) {
        const normalizedOptions = normalizeConstructorOptions(modelNameOrOptions, modelClientOptions, options);
        this.backend = resolveEvaluatorBackend(normalizedOptions.backend);
        this.v3 = v3;
        this.modelName =
            normalizedOptions.modelName ||
                "google/gemini-2.5-flash";
        this.modelClientOptions = normalizedOptions.modelClientOptions || {
            apiKey: process.env.GEMINI_API_KEY ||
                process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
                "",
        };
        this.legacyEvaluator = new LegacyV3Evaluator(v3, normalizedOptions.modelName, normalizedOptions.modelClientOptions);
    }
    async ask(options) {
        return this.getLegacyBackend("ask").ask(options);
    }
    async batchAsk(options) {
        return this.getLegacyBackend("batchAsk").batchAsk(options);
    }
    async verify(trajectory) {
        const taskSpec = assertVerifierInput(trajectory);
        if (this.backend === "legacy") {
            return this.verifyTrajectoryWithLegacyEvaluator(trajectory, taskSpec);
        }
        const verifier = new RubricVerifier({
            getClient: () => this.getClient(),
            getRubricGenClient: () => this.getRubricGenClient(),
        });
        return verifier.verify(trajectory);
    }
    async generateRubric(taskSpec) {
        if (!taskSpec?.id) {
            throw new StagehandInvalidArgumentError("TaskSpec.id is required for rubric generation");
        }
        if (this.backend === "legacy") {
            return {
                items: [legacyTaskCompletionCriterion(taskSpec)],
            };
        }
        const verifier = new RubricVerifier({
            getClient: () => this.getClient(),
            getRubricGenClient: () => this.getRubricGenClient(),
        });
        return verifier.generateRubric(taskSpec);
    }
    getLegacyBackend(methodName) {
        if (this.backend === "legacy") {
            return this.legacyEvaluator;
        }
        return this.unavailableVerifierBackend(methodName);
    }
    unavailableVerifierBackend(methodName) {
        throw new StagehandInvalidArgumentError(`V3Evaluator.${methodName}() was configured with ${EVALUATOR_BACKEND_ENV}=verifier, but the verifier backend only supports verify() and generateRubric(). Use "legacy" for ask()/batchAsk().`);
    }
    getClient() {
        const provider = new LLMProvider(this.v3.logger);
        return provider.getClient(this.modelName, this.modelClientOptions);
    }
    getRubricGenClient() {
        const override = process.env.VERIFIER_RUBRIC_MODEL;
        if (!override)
            return this.getClient();
        const provider = new LLMProvider(this.v3.logger);
        const overrideProvider = override.includes("/")
            ? override.slice(0, override.indexOf("/"))
            : undefined;
        const defaultProvider = this.modelName.includes("/")
            ? this.modelName.slice(0, this.modelName.indexOf("/"))
            : undefined;
        const sameProvider = overrideProvider !== undefined && overrideProvider === defaultProvider;
        return provider.getClient(override, sameProvider ? this.modelClientOptions : undefined);
    }
    async verifyTrajectoryWithLegacyEvaluator(trajectory, taskSpec) {
        const screenshots = collectLegacyScreenshots(trajectory);
        const agentReasoning = renderLegacyAgentReasoning(trajectory);
        const answer = trajectory.finalAnswer;
        if (!screenshots.length && !answer) {
            return legacyInsufficientEvidenceResult("Legacy evaluator compatibility mode had no screenshots or final answer to evaluate.");
        }
        const result = await this.legacyEvaluator.ask({
            question: taskSpec.instruction,
            screenshot: screenshots.length ? screenshots : false,
            answer,
            agentReasoning,
        });
        return legacyEvaluationToResult(result, screenshots.length);
    }
}
function normalizeConstructorOptions(modelNameOrOptions, modelClientOptions, options) {
    if (modelNameOrOptions &&
        typeof modelNameOrOptions === "object" &&
        !Array.isArray(modelNameOrOptions)) {
        return {
            modelName: modelNameOrOptions.modelName,
            modelClientOptions: modelNameOrOptions.modelClientOptions,
            backend: modelNameOrOptions.backend ?? options?.backend,
        };
    }
    return {
        modelName: modelNameOrOptions,
        modelClientOptions,
        backend: options?.backend,
    };
}
function resolveEvaluatorBackend(explicitBackend) {
    const configuredBackend = explicitBackend ??
        process.env[EVALUATOR_BACKEND_ENV] ??
        DEFAULT_EVALUATOR_BACKEND;
    const normalizedBackend = configuredBackend.trim().toLowerCase();
    if (normalizedBackend === "legacy" || normalizedBackend === "verifier") {
        return normalizedBackend;
    }
    throw new StagehandInvalidArgumentError(`Invalid ${EVALUATOR_BACKEND_ENV}="${configuredBackend}". Expected "legacy" or "verifier".`);
}
function assertVerifierInput(trajectory) {
    if (!trajectory) {
        throw new StagehandInvalidArgumentError("Trajectory is required for verification");
    }
    if (!trajectory.task?.id) {
        throw new StagehandInvalidArgumentError("Trajectory.task.id is required for verification");
    }
    return trajectory.task;
}
function legacyTaskCompletionCriterion(taskSpec) {
    return {
        criterion: "legacy-task-completion",
        description: `Evaluate whether the task was completed successfully: ${taskSpec.instruction}`,
        maxPoints: 1,
    };
}
function collectLegacyScreenshots(trajectory) {
    const screenshots = [];
    for (const step of trajectory.steps ?? []) {
        if (Buffer.isBuffer(step.probeEvidence?.screenshot)) {
            screenshots.push(step.probeEvidence.screenshot);
            continue;
        }
        const agentImage = step.agentEvidence?.modalities?.find((modality) => modality.type === "image" && Buffer.isBuffer(modality.bytes));
        if (agentImage) {
            screenshots.push(agentImage.bytes);
        }
    }
    if (Buffer.isBuffer(trajectory.finalObservation?.screenshot)) {
        screenshots.push(trajectory.finalObservation.screenshot);
    }
    return screenshots;
}
function renderLegacyAgentReasoning(trajectory) {
    const stepLines = (trajectory.steps ?? []).map((step, i) => {
        const status = step.toolOutput?.ok === false ? "Tool status: failed" : "";
        const output = step.toolOutput?.error
            ? `Tool error: ${step.toolOutput.error}`
            : `Tool output: ${stringifyForPrompt(step.toolOutput?.result)}`;
        return [
            `Step ${i}: ${step.actionName}`,
            step.reasoning ? `Reasoning: ${step.reasoning}` : undefined,
            status || undefined,
            output,
        ]
            .filter(Boolean)
            .join("\n");
    });
    if (!stepLines.length) {
        return undefined;
    }
    return truncateForPrompt(`Agent trajectory:\n${stepLines.join("\n\n")}`, 16000);
}
function stringifyForPrompt(value) {
    if (typeof value === "string") {
        return value;
    }
    try {
        const serialized = JSON.stringify(value);
        return serialized ?? String(value);
    }
    catch {
        return String(value);
    }
}
function truncateForPrompt(value, maxLength) {
    if (value.length <= maxLength) {
        return value;
    }
    return `${value.slice(0, maxLength)}... [truncated]`;
}
function legacyEvaluationToResult(result, screenshotCount) {
    const outcomeSuccess = result.evaluation === "YES";
    const invalid = result.evaluation === "INVALID";
    const findings = invalid
        ? [
            {
                category: "verifier_uncertainty",
                severity: "warning",
                description: result.reasoning,
            },
        ]
        : [];
    return {
        outcomeSuccess,
        explanation: result.reasoning,
        ...(findings.length ? { findings } : {}),
        rawSteps: {
            backend: "legacy",
            legacyEvaluation: result.evaluation,
            screenshotCount,
        },
    };
}
function legacyInsufficientEvidenceResult(reason) {
    return {
        outcomeSuccess: false,
        explanation: reason,
        findings: [
            {
                category: "trajectory_capture",
                severity: "blocking",
                description: reason,
            },
        ],
        rawSteps: {
            backend: "legacy",
            legacyEvaluation: "INVALID",
            screenshotCount: 0,
        },
    };
}
