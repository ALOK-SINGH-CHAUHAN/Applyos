import { EvalsError } from "../errors.js";
import { buildOnlineMind2WebTestcases } from "../suites/onlineMind2Web.js";
import { buildWebTailBenchTestcases } from "../suites/webtailbench.js";
import { buildWebVoyagerTestcases } from "../suites/webvoyager.js";
import { buildOdysseysBenchTestcases } from "../suites/odysseysbench.js";
import { getAgentModelEntries, getModelList, } from "../taskConfig.js";
import { DEFAULT_BENCH_HARNESS, } from "./benchTypes.js";
import { getBrowseCliToolMetadata, resolveClaudeCodeStartupProfile, resolveClaudeCodeToolSurface, } from "./claudeCodeToolAdapter.js";
import { resolveCodexStartupProfile, resolveCodexToolSurface, } from "./codexToolAdapter.js";
import { inferDefaultStagehandAgentMode, isCuaCapableModel, } from "./agentModelModes.js";
const DEFAULT_CLAUDE_CODE_MODELS = [
    "anthropic/claude-sonnet-4-6",
];
const DEFAULT_CODEX_MODELS = [
    "openai/gpt-5.4-mini",
];
export function inferEffectiveBenchCategory(benchTasks, categoryFilter) {
    let effectiveCategory = categoryFilter ?? null;
    if (!effectiveCategory &&
        benchTasks.length === 1 &&
        benchTasks[0].categories.length === 1 &&
        (benchTasks[0].categories[0] === "agent" ||
            benchTasks[0].categories[0] === "external_agent_benchmarks")) {
        effectiveCategory = benchTasks[0].categories[0];
    }
    return effectiveCategory;
}
export function resolveBenchModelEntries(benchTasks, options) {
    const effectiveCategory = inferEffectiveBenchCategory(benchTasks, options.categoryFilter);
    const isAgentCategory = effectiveCategory === "agent" ||
        effectiveCategory === "external_agent_benchmarks";
    const harness = options.harness ?? DEFAULT_BENCH_HARNESS;
    const requestedAgentModes = harness === "stagehand" ? resolveRequestedAgentModes(options) : undefined;
    if (options.modelOverride) {
        const baseModes = isAgentCategory && requestedAgentModes
            ? requestedAgentModes
            : [
                harness === "stagehand"
                    ? resolveAgentModeForModel(options.modelOverride)
                    : "hybrid",
            ];
        const modelEntries = uniqueAgentModelEntries(baseModes.map((mode) => ({
            modelName: options.modelOverride,
            mode,
            cua: mode === "cua",
        })));
        const compatibleEntries = isAgentCategory && requestedAgentModes
            ? expandAgentEntriesForRequestedModes(modelEntries, requestedAgentModes)
            : modelEntries;
        assertCompatibleAgentModelEntries(compatibleEntries, requestedAgentModes);
        return {
            effectiveCategory,
            isAgentCategory,
            modelEntries: compatibleEntries,
        };
    }
    const modelEntries = resolveDefaultModelEntries(harness, effectiveCategory, isAgentCategory);
    return {
        effectiveCategory,
        isAgentCategory,
        modelEntries: isAgentCategory && requestedAgentModes
            ? expandAgentEntriesForRequestedModes(modelEntries, requestedAgentModes)
            : modelEntries,
    };
}
function expandAgentEntriesForRequestedModes(entries, requestedModes) {
    const expanded = entries.flatMap((entry) => {
        if (isCuaCapableModel(entry.modelName)) {
            return requestedModes.map((mode) => ({
                modelName: entry.modelName,
                mode,
                cua: mode === "cua",
            }));
        }
        return requestedModes
            .filter((mode) => mode !== "cua")
            .map((mode) => ({
            modelName: entry.modelName,
            mode,
            cua: false,
        }));
    });
    return uniqueAgentModelEntries(expanded);
}
function uniqueAgentModelEntries(entries) {
    const seen = new Set();
    return entries.filter((entry) => {
        const key = `${entry.modelName}:${entry.mode}`;
        if (seen.has(key))
            return false;
        seen.add(key);
        return true;
    });
}
function assertCompatibleAgentModelEntries(entries, requestedModes) {
    if (entries.length > 0 || !requestedModes || requestedModes.length === 0) {
        return;
    }
    throw new EvalsError(`No compatible agent model entries for requested mode(s): ${requestedModes.join(", ")}. Non-CUA models require "dom" or "hybrid"; CUA-capable models are required for "cua".`);
}
function resolveDefaultModelEntries(harness, effectiveCategory, isAgentCategory) {
    if (harness === "claude_code") {
        return readModelListEnv("EVAL_CLAUDE_CODE_MODELS", DEFAULT_CLAUDE_CODE_MODELS).map((modelName) => ({
            modelName,
            mode: "hybrid",
            cua: false,
        }));
    }
    if (harness === "codex") {
        return readModelListEnv("EVAL_CODEX_MODELS", DEFAULT_CODEX_MODELS).map((modelName) => ({
            modelName,
            mode: "hybrid",
            cua: false,
        }));
    }
    return isAgentCategory
        ? getAgentModelEntries()
        : getModelList(effectiveCategory).map((modelName) => ({
            modelName,
            mode: "hybrid",
            cua: false,
        }));
}
function readModelListEnv(key, fallback) {
    const raw = process.env[key];
    if (!raw)
        return fallback;
    const values = raw
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
    return values.length > 0 ? values : fallback;
}
function resolveRequestedAgentModes(options) {
    if (options.agentMode)
        return [options.agentMode];
    if (!options.agentModes || options.agentModes.length === 0) {
        return undefined;
    }
    return [...new Set(options.agentModes)];
}
function resolveAgentModeForModel(modelName) {
    return inferDefaultStagehandAgentMode(modelName);
}
export function inferBenchTaskKind(task) {
    if (task.name.startsWith("agent/"))
        return "suite";
    if (task.primaryCategory === "agent")
        return "agent";
    if (isBenchTaskKind(task.primaryCategory))
        return task.primaryCategory;
    return "combination";
}
function isBenchTaskKind(value) {
    return (value === "act" ||
        value === "extract" ||
        value === "observe" ||
        value === "agent" ||
        value === "combination" ||
        value === "suite");
}
export function buildBenchMatrixRow(task, modelName, options, params, isCUA, agentMode) {
    const harness = options.harness ?? DEFAULT_BENCH_HARNESS;
    const environment = options.environment ?? "LOCAL";
    const useApi = Boolean(options.useApi);
    const toolSurface = resolveBenchRowToolSurface(harness, options.coreToolSurface);
    const startupProfile = resolveBenchRowStartupProfile(harness, toolSurface, environment, options.coreStartupProfile);
    const resolvedAgentMode = agentMode ?? (isCUA ? "cua" : undefined);
    const resolvedIsCUA = resolvedAgentMode ? resolvedAgentMode === "cua" : isCUA;
    const config = buildBenchHarnessConfig({
        harness,
        model: modelName,
        provider: options.provider,
        environment,
        useApi,
        agentMode: resolvedAgentMode,
        isCUA: resolvedIsCUA,
        toolSurface,
        startupProfile,
        dataset: options.datasetFilter,
    });
    return {
        harness,
        task: task.name,
        category: task.primaryCategory,
        taskKind: inferBenchTaskKind(task),
        model: modelName,
        provider: options.provider,
        environment,
        useApi,
        toolSurface,
        startupProfile,
        trial: 1,
        dataset: options.datasetFilter,
        params,
        agentMode: resolvedAgentMode,
        isCUA: resolvedIsCUA,
        config,
    };
}
function buildBenchHarnessConfig(input) {
    if (input.harness === "stagehand") {
        return {
            harness: "stagehand",
            model: input.model,
            provider: input.provider,
            environment: input.environment,
            useApi: input.useApi,
            agentMode: input.agentMode,
            isCUA: input.isCUA,
            toolSurface: input.toolSurface,
            startupProfile: input.startupProfile,
            dataset: input.dataset,
        };
    }
    return {
        harness: input.harness,
        model: input.model,
        provider: input.provider,
        environment: input.environment,
        useApi: input.useApi,
        toolSurface: input.toolSurface,
        startupProfile: input.startupProfile,
        dataset: input.dataset,
    };
}
export function generateBenchTestcases(benchTasks, options) {
    const { isAgentCategory, modelEntries } = resolveBenchModelEntries(benchTasks, options);
    const suiteTestcases = generateSuiteTestcases(benchTasks, options, modelEntries);
    const allTestcases = [...suiteTestcases.testcases];
    if (options.harness === "claude_code" || options.harness === "codex") {
        if (suiteTestcases.remainingTasks.length > 0) {
            const unsupported = suiteTestcases.remainingTasks
                .map((task) => task.name)
                .sort()
                .join(", ");
            throw new EvalsError(`Harness "${options.harness}" only supports agent benchmark suites: agent/webvoyager, agent/onlineMind2Web, agent/webtailbench. Unsupported task(s): ${unsupported}.`);
        }
        return allTestcases;
    }
    for (const entry of modelEntries) {
        for (const task of suiteTestcases.remainingTasks) {
            const model = entry.modelName;
            const row = buildBenchMatrixRow(task, model, options, undefined, isAgentCategory && rowUsesStagehand(options)
                ? entry.mode === "cua"
                : undefined, isAgentCategory && rowUsesStagehand(options)
                ? (options.agentMode ?? entry.mode)
                : undefined);
            const agentMode = row.agentMode;
            const includeStagehandAgentMode = isAgentCategory && rowUsesStagehand(options) && agentMode;
            allTestcases.push({
                input: {
                    name: task.name,
                    modelName: model,
                    ...(includeStagehandAgentMode && {
                        agentMode,
                        isCUA: agentMode === "cua",
                    }),
                },
                name: task.name,
                tags: [
                    entry.modelName,
                    ...(includeStagehandAgentMode ? [agentMode] : []),
                    task.name,
                    ...task.categories.map((x) => `category/${x}`),
                    `harness/${row.harness}`,
                ],
                metadata: {
                    model,
                    test: task.name,
                    tier: "bench",
                    task: task.name,
                    categories: task.categories,
                    task_category: task.primaryCategory,
                    harness: row.harness,
                    environment: row.environment,
                    api: row.useApi,
                    provider: row.provider,
                    toolSurface: row.toolSurface,
                    startupProfile: row.startupProfile,
                    ...buildToolMetadata(row),
                    agentMode: row.agentMode,
                },
                expected: true,
            });
        }
    }
    return allTestcases;
}
function rowUsesStagehand(options) {
    return (options.harness ?? DEFAULT_BENCH_HARNESS) === "stagehand";
}
function resolveBenchRowToolSurface(harness, requested) {
    if (harness === "claude_code") {
        return resolveClaudeCodeToolSurface(requested);
    }
    if (harness === "codex") {
        return resolveCodexToolSurface(requested);
    }
    return requested;
}
function resolveBenchRowStartupProfile(harness, toolSurface, environment, requested) {
    if (harness === "claude_code") {
        return resolveClaudeCodeStartupProfile(toolSurface ?? "browse_cli", environment, requested);
    }
    if (harness === "codex") {
        return resolveCodexStartupProfile(toolSurface ?? "browse_cli", environment, requested);
    }
    return requested;
}
export function generateSuiteTestcases(benchTasks, options, modelEntries) {
    const testcases = [];
    const remaining = [...benchTasks];
    const datasetFilter = options.datasetFilter;
    const suiteMap = {
        "agent/webvoyager": (models) => buildWebVoyagerTestcases(models),
        "agent/onlineMind2Web": (models) => buildOnlineMind2WebTestcases(models),
        "agent/webtailbench": (models) => buildWebTailBenchTestcases(models),
        "agent/odysseysbench": (models) => buildOdysseysBenchTestcases(models),
    };
    const legacyOnlySuites = new Set(["agent/gaia"]);
    for (const suiteName of legacyOnlySuites) {
        const idx = remaining.findIndex((t) => t.name === suiteName);
        if (idx === -1)
            continue;
        throw new EvalsError(`Benchmark "${suiteName}" is legacy-only. Use --legacy or choose b:webvoyager / b:onlineMind2Web / b:webtailbench.`);
    }
    for (const [suiteName, builder] of Object.entries(suiteMap)) {
        const idx = remaining.findIndex((t) => t.name === suiteName);
        if (idx === -1)
            continue;
        const datasetName = suiteName.split("/").pop();
        if (!datasetFilter || datasetFilter === datasetName) {
            const task = remaining[idx];
            testcases.push(...builder(modelEntries).map((testcase) => withBenchMetadata(testcase, task, options)));
        }
        remaining.splice(idx, 1);
    }
    return { testcases, remainingTasks: remaining };
}
function withBenchMetadata(testcase, task, options) {
    const isStagehand = rowUsesStagehand(options);
    const agentMode = isStagehand
        ? (options.agentMode ?? testcase.input.agentMode)
        : undefined;
    const row = buildBenchMatrixRow(task, testcase.input.modelName, options, testcase.input.params, agentMode === "cua", agentMode);
    const tags = testcase.tags.filter((tag) => tag !== "dom" && tag !== "hybrid" && tag !== "cua");
    if (isStagehand && agentMode)
        tags.push(agentMode);
    const inputWithoutStagehandMode = { ...testcase.input };
    delete inputWithoutStagehandMode.agentMode;
    delete inputWithoutStagehandMode.isCUA;
    return {
        ...testcase,
        input: isStagehand
            ? {
                ...testcase.input,
                ...(agentMode && { agentMode, isCUA: agentMode === "cua" }),
            }
            : inputWithoutStagehandMode,
        tags: [...tags, `harness/${row.harness}`],
        metadata: {
            ...testcase.metadata,
            tier: "bench",
            task: task.name,
            category: task.categories[0] ?? task.primaryCategory,
            categories: task.categories,
            // Preserve the dataset row's fine-grained category (e.g. webtailbench's
            // hotels_head / flights / jobs) that the suite builder set on the
            // testcase. Only fall back to the directory category when the row didn't
            // carry one — otherwise all three category fields collapse to "agent".
            task_category: testcase.metadata.task_category ??
                row.params?.category ??
                task.primaryCategory,
            harness: row.harness,
            environment: row.environment,
            api: row.useApi,
            provider: row.provider,
            toolSurface: row.toolSurface,
            startupProfile: row.startupProfile,
            ...buildToolMetadata(row),
            agentMode: row.agentMode,
        },
    };
}
function buildToolMetadata(row) {
    if ((row.harness === "claude_code" || row.harness === "codex") &&
        row.toolSurface === "browse_cli") {
        return getBrowseCliToolMetadata();
    }
    return {};
}
