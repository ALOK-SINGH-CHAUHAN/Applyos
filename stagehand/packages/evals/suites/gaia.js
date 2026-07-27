import path from "path";
import { tasksConfig } from "../taskConfig.js";
import { getCurrentDirPath } from "../runtimePaths.js";
import { readJsonlFile, parseJsonlRows, applySampling, normalizeAgentModelEntries, } from "../utils.js";
export const buildGAIATestcases = (models) => {
    const moduleDir = getCurrentDirPath();
    const gaiaFilePath = process.env.EVAL_GAIA_FILE ||
        path.join(moduleDir, "..", "datasets", "gaia", "GAIA_web.jsonl");
    const gaiaLines = readJsonlFile(gaiaFilePath);
    const levelFilter = process.env.EVAL_GAIA_LEVEL
        ? Number(process.env.EVAL_GAIA_LEVEL)
        : undefined;
    // Use EVAL_MAX_K if set, otherwise fall back to EVAL_GAIA_LIMIT or default to 25
    const maxCases = process.env.EVAL_MAX_K
        ? Number(process.env.EVAL_MAX_K)
        : process.env.EVAL_GAIA_LIMIT
            ? Number(process.env.EVAL_GAIA_LIMIT)
            : 25;
    const sampleCount = process.env.EVAL_GAIA_SAMPLE
        ? Number(process.env.EVAL_GAIA_SAMPLE)
        : undefined;
    function isGaiaRow(parsed) {
        if (parsed === null || typeof parsed !== "object")
            return false;
        const obj = parsed;
        return (typeof obj.id === "string" &&
            typeof obj.web === "string" &&
            typeof obj.ques === "string");
    }
    const candidates = parseJsonlRows(gaiaLines, isGaiaRow);
    // Filter by level if specified
    const filteredCandidates = levelFilter
        ? candidates.filter((row) => row.Level === levelFilter)
        : candidates;
    const gaiaRows = applySampling(filteredCandidates, sampleCount, maxCases);
    const allTestcases = [];
    for (const modelEntry of normalizeAgentModelEntries(models)) {
        for (const row of gaiaRows) {
            const finalAnswer = row["Final answer"];
            const input = {
                name: "agent/gaia",
                modelName: modelEntry.modelName,
                agentMode: modelEntry.mode,
                isCUA: modelEntry.mode === "cua",
                params: {
                    id: row.id,
                    level: row.Level,
                    web: row.web,
                    ques: row.ques,
                    expected: typeof finalAnswer === "string" ? finalAnswer : undefined,
                },
            };
            allTestcases.push({
                input,
                name: input.name,
                tags: [
                    modelEntry.modelName,
                    modelEntry.mode,
                    input.name,
                    ...(tasksConfig.find((t) => t.name === input.name)?.categories || []).map((x) => `category/${x}`),
                    `gaia/id/${row.id}`,
                    row.Level ? `gaia/level/${row.Level}` : "gaia/level/unknown",
                ],
                metadata: {
                    model: modelEntry.modelName,
                    test: `${input.name}:${row.id}`,
                    tier: "bench",
                    task: input.name,
                },
                expected: true,
            });
        }
    }
    return allTestcases;
};
