/**
 * Rubric cache — persists AI-generated rubrics so each task id can hydrate
 * from disk after its first generated rubric.
 *
 * Used for any task whose dataset doesn't ship a precomputed_rubric
 * (Mind2Web, ad-hoc bench tasks, etc.). WebTailBench is exempt — its
 * upstream dataset already carries rubrics.
 *
 * Cache layout:
 *   packages/evals/.rubric-cache/<dataset>/<task-id>.json
 *
 * The cache key includes the task id and instruction hash to detect drift —
 * if either changes, the rubric is regenerated rather than served from a
 * stale cache.
 */
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
function hashInstruction(instruction) {
    return crypto
        .createHash("sha256")
        .update(instruction)
        .digest("hex")
        .slice(0, 16);
}
export class RubricCache {
    cacheDir;
    constructor(opts) {
        const root = opts.cacheRoot ??
            path.join(process.cwd(), "packages/evals/.rubric-cache");
        this.cacheDir = path.join(root, opts.dataset);
    }
    /** Read a cached rubric. Returns undefined on miss or cache-key drift. */
    async read(taskSpec) {
        const file = this.entryPath(taskSpec.id);
        let raw;
        try {
            raw = await fs.readFile(file, "utf8");
        }
        catch {
            return undefined;
        }
        let parsed;
        try {
            parsed = JSON.parse(raw);
        }
        catch {
            return undefined;
        }
        if (parsed.taskId !== taskSpec.id) {
            console.warn(`[rubric-cache] task-id mismatch for ${taskSpec.id}; regenerating`);
            return undefined;
        }
        const expectedHash = hashInstruction(taskSpec.instruction);
        if (parsed.instructionHash !== expectedHash) {
            // Drift detected — surface a clear log and miss.
            console.warn(`[rubric-cache] instruction-hash drift for ${taskSpec.id}; regenerating`);
            return undefined;
        }
        return parsed.rubric;
    }
    async write(taskSpec, rubric) {
        await fs.mkdir(this.cacheDir, { recursive: true });
        const entry = {
            taskId: taskSpec.id,
            instructionHash: hashInstruction(taskSpec.instruction),
            generatedAt: new Date().toISOString(),
            rubric,
        };
        await fs.writeFile(this.entryPath(taskSpec.id), JSON.stringify(entry, null, 2));
    }
    /** Wipe the cache directory (used by tests / `bench cache clear`). */
    async clear() {
        await fs.rm(this.cacheDir, { recursive: true, force: true });
    }
    entryPath(taskId) {
        // Sanitize task id for filesystem safety.
        const safe = taskId.replace(/[^A-Za-z0-9._-]/g, "_");
        return path.join(this.cacheDir, `${safe}.json`);
    }
}
