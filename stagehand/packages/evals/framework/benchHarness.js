import { AgentProvider, V3, getAISDKLanguageModel, loadApiKeyFromEnv, normalizeRubric, } from "@browserbasehq/stagehand";
import { AISdkClientWrapped } from "../lib/AISdkClientWrapped.js";
import { endBrowserbaseSession } from "../browserbaseCleanup.js";
import { EvalsError } from "../errors.js";
import { runClaudeCodeAgent } from "./claudeCodeRunner.js";
import { prepareClaudeCodeToolAdapter, } from "./claudeCodeToolAdapter.js";
import { runCodexAgent } from "./codexRunner.js";
import { prepareCodexToolAdapter, } from "./codexToolAdapter.js";
import { buildExternalHarnessTaskPlan } from "./externalHarnessPlan.js";
function isAgentTask(task) {
    return (task.primaryCategory === "agent" ||
        task.categories.includes("agent") ||
        task.categories.includes("external_agent_benchmarks"));
}
/**
 * Build a verifier-carrier V3 instance. Used only as the LLM-client carrier
 * for V3Evaluator.verify() — never `init()`-ed, never drives a browser.
 * The instance's logger is what V3Evaluator uses to construct its LLMProvider.
 *
 * The model is deliberately left at V3's default: the harness model can be a
 * runner-only alias (e.g. "codex/default") that V3's provider map rejects at
 * construction, and V3Evaluator selects its own verifier model regardless.
 */
function buildVerifierCarrierV3(logger) {
    return new V3({
        env: "LOCAL",
        logger: logger.log.bind(logger),
        disablePino: true,
        disableAPI: true,
        experimental: true,
        verbose: 0,
    });
}
function buildExternalHarnessTaskSpec(plan, input) {
    // Datasets that ship curated rubrics (WebTailBench) carry them in
    // params.precomputed_rubric — thread them through so external-harness runs
    // grade against the same rubric as the stagehand harness instead of
    // LLM-generating a divergent one.
    const precomputedRubric = normalizeRubric(input.params?.precomputed_rubric);
    return {
        id: plan.taskId ?? input.name,
        instruction: plan.instruction,
        initUrl: plan.startUrl,
        ...(precomputedRubric && { precomputedRubric }),
    };
}
function resolveProvider(modelName) {
    if (modelName.includes("/")) {
        return modelName.split("/")[0];
    }
    try {
        return AgentProvider.getAgentProvider(modelName);
    }
    catch {
        return undefined;
    }
}
export const stagehandHarness = {
    harness: "stagehand",
    supportedTaskKinds: [
        "act",
        "extract",
        "observe",
        "agent",
        "combination",
        "suite",
    ],
    supportsApi: true,
    async start({ task, input, row, logger, verbose, }) {
        let v3Result;
        const createAgent = isAgentTask(task);
        if (row.config.harness !== "stagehand") {
            throw new EvalsError(`Harness "${row.config.harness}" is not implemented yet. Use --harness stagehand for the current unified runner.`);
        }
        const config = row.config;
        const agentMode = config.agentMode ?? input.agentMode;
        const isCUA = config.isCUA ?? input.isCUA;
        if (config.useApi) {
            const provider = resolveProvider(input.modelName);
            const logFn = (line) => logger.log(line);
            const apiKey = loadApiKeyFromEnv(provider, logFn);
            if (!apiKey) {
                throw new EvalsError(`USE_API=true but no API key found for provider "${provider}".`);
            }
            const { initV3 } = await import("../initV3.js");
            v3Result = await initV3({
                logger,
                modelName: input.modelName,
                modelClientOptions: { apiKey },
                createAgent,
                agentMode,
                isCUA,
                verbose,
                configOverrides: { env: config.environment },
            });
        }
        else {
            let llmClient;
            if (input.modelName.includes("/")) {
                const firstSlashIndex = input.modelName.indexOf("/");
                llmClient = new AISdkClientWrapped({
                    model: getAISDKLanguageModel(input.modelName.substring(0, firstSlashIndex), input.modelName.substring(firstSlashIndex + 1)),
                });
            }
            const { initV3 } = await import("../initV3.js");
            v3Result = await initV3({
                logger,
                llmClient,
                modelName: input.modelName,
                createAgent,
                agentMode,
                isCUA,
                verbose,
                configOverrides: { env: config.environment },
            });
        }
        return {
            ctx: {
                harness: "stagehand",
                row,
                logger,
                v3: v3Result.v3,
                agent: v3Result.agent,
                page: v3Result.v3.context.pages()[0],
                debugUrl: v3Result.debugUrl ?? "",
                sessionUrl: v3Result.sessionUrl ?? "",
            },
            cleanup: async () => {
                if (v3Result?.v3) {
                    try {
                        await v3Result.v3.close();
                    }
                    catch (closeError) {
                        console.error(`Warning: Error closing V3 instance for ${input.name}:`, closeError);
                    }
                }
                await endBrowserbaseSession(v3Result?.v3);
            },
        };
    },
};
export const claudeCodeHarness = {
    harness: "claude_code",
    supportedTaskKinds: ["agent", "suite"],
    supportsApi: false,
    async execute({ input, row, logger, signal, }) {
        const plan = buildExternalHarnessTaskPlan(input);
        if (row.config.harness !== "claude_code") {
            throw new EvalsError(`Expected claude_code harness config, received "${row.config.harness}".`);
        }
        // Everything past carrier construction runs inside one try/finally so a
        // failure at any point — adapter preparation included — cleans up both
        // the adapter and the carrier.
        const carrierV3 = buildVerifierCarrierV3(logger);
        let toolAdapter;
        try {
            toolAdapter = await prepareClaudeCodeToolAdapter({
                toolSurface: row.config.toolSurface,
                startupProfile: row.config.startupProfile,
                environment: row.config.environment,
                plan,
                logger,
            });
            return await runClaudeCodeAgent({
                plan,
                model: input.modelName,
                logger,
                toolAdapter,
                signal,
                verifier: {
                    v3: carrierV3,
                    taskSpec: buildExternalHarnessTaskSpec(plan, input),
                    dataset: plan.dataset,
                },
            });
        }
        finally {
            await toolAdapter?.cleanup();
            // Deregister the never-init()-ed carrier (instance registry, event
            // store, logger binding) so long matrix runs don't accumulate one
            // V3 object graph per task.
            await carrierV3.close().catch(() => { });
        }
    },
    async start() {
        throw new EvalsError("Claude Code harness execution uses the external harness execute path. Use --dry-run to inspect its bench matrix, or run with --harness claude_code.");
    },
};
export const codexHarness = {
    harness: "codex",
    supportedTaskKinds: ["agent", "suite"],
    supportsApi: false,
    async execute({ input, row, logger, signal, }) {
        const plan = buildExternalHarnessTaskPlan(input);
        if (row.config.harness !== "codex") {
            throw new EvalsError(`Expected codex harness config, received "${row.config.harness}".`);
        }
        // Everything past carrier construction runs inside one try/finally so a
        // failure at any point — adapter preparation included — cleans up both
        // the adapter and the carrier.
        const carrierV3 = buildVerifierCarrierV3(logger);
        let toolAdapter;
        try {
            toolAdapter = await prepareCodexToolAdapter({
                toolSurface: row.config.toolSurface,
                startupProfile: row.config.startupProfile,
                environment: row.config.environment,
                plan,
                logger,
            });
            return await runCodexAgent({
                plan,
                model: input.modelName,
                logger,
                toolAdapter,
                signal,
                verifier: {
                    v3: carrierV3,
                    taskSpec: buildExternalHarnessTaskSpec(plan, input),
                    dataset: plan.dataset,
                },
            });
        }
        finally {
            await toolAdapter?.cleanup();
            // Deregister the never-init()-ed carrier (instance registry, event
            // store, logger binding) so long matrix runs don't accumulate one
            // V3 object graph per task.
            await carrierV3.close().catch(() => { });
        }
    },
    async start() {
        throw new EvalsError("Codex harness execution uses the external harness execute path. Use --dry-run to inspect its bench matrix, or run with --harness codex.");
    },
};
const harnessRegistry = new Map([
    ["stagehand", stagehandHarness],
    ["claude_code", claudeCodeHarness],
    ["codex", codexHarness],
]);
export function getBenchHarness(harness) {
    const implementation = harnessRegistry.get(harness);
    if (!implementation) {
        throw new EvalsError(`Harness "${harness}" is not implemented yet. Use --harness stagehand for the current unified runner.`);
    }
    return implementation;
}
