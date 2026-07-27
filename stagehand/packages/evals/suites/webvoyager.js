import path from "path";
import { tasksConfig } from "../taskConfig.js";
import { getPackageRootDir } from "../runtimePaths.js";
import { readJsonlFile, parseJsonlRows, applySampling, normalizeAgentModelEntries, } from "../utils.js";
export const buildWebVoyagerTestcases = (models) => {
    const voyagerFilePath = path.join(getPackageRootDir(), "datasets", "webvoyager", "WebVoyager_data.jsonl");
    const lines = readJsonlFile(voyagerFilePath);
    // Use EVAL_MAX_K if set, otherwise fall back to EVAL_WEBVOYAGER_LIMIT or default to 25
    const maxCases = process.env.EVAL_MAX_K
        ? Number(process.env.EVAL_MAX_K)
        : process.env.EVAL_WEBVOYAGER_LIMIT
            ? Number(process.env.EVAL_WEBVOYAGER_LIMIT)
            : 25;
    const sampleCount = process.env.EVAL_WEBVOYAGER_SAMPLE
        ? Number(process.env.EVAL_WEBVOYAGER_SAMPLE)
        : undefined;
    function isVoyagerRow(parsed) {
        if (parsed === null || typeof parsed !== "object")
            return false;
        const obj = parsed;
        return (typeof obj.id === "string" &&
            typeof obj.web === "string" &&
            typeof obj.ques === "string");
    }
    const candidates = parseJsonlRows(lines, isVoyagerRow);
    const rows = applySampling(candidates, sampleCount, maxCases);
    const allTestcases = [];
    for (const modelEntry of normalizeAgentModelEntries(models)) {
        for (const row of rows) {
            const input = {
                name: "agent/webvoyager",
                modelName: modelEntry.modelName,
                agentMode: modelEntry.mode,
                isCUA: modelEntry.mode === "cua",
                params: {
                    id: row.id,
                    web: row.web,
                    ques: row.ques,
                    web_name: row.web_name,
                },
            };
            const taskCategories = tasksConfig.find((t) => t.name === input.name)?.categories || [];
            allTestcases.push({
                input,
                name: input.name,
                tags: [
                    modelEntry.modelName,
                    modelEntry.mode,
                    "webvoyager", // Simple dataset tag
                ],
                metadata: {
                    model: modelEntry.modelName,
                    test: `${input.name}:${row.id}`,
                    tier: "bench",
                    task: input.name,
                    category: taskCategories[0] || "agent",
                    categories: taskCategories,
                    dataset: "webvoyager",
                    task_id: row.id,
                    website: row.web_name || row.web,
                },
                expected: true,
            });
        }
    }
    return allTestcases;
};
