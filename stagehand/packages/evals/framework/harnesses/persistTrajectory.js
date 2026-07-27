import fs from "node:fs/promises";
import path from "node:path";
import { shouldPersistTrajectory, writeTrajectoryDir, } from "@browserbasehq/stagehand";
import { reserveTrajectoryDir, resolveTrajectoryDir, resolveTrajectoryRoot, writeTrajectoryMetadata, } from "../trajectoryGroup.js";
/**
 * Persist a trajectory produced by an external-harness adapter (claude_code,
 * codex). External harnesses produce a complete Trajectory synchronously
 * rather than streaming bus events, so they bypass TrajectoryRecorder and
 * call writeTrajectoryDir directly. The evaluationResult, if supplied, is
 * also written under scores/result.json and merged into task_data.json.
 */
export async function persistAdapterTrajectory(opts) {
    const runId = opts.runId ?? new Date().toISOString().replace(/[:.]/g, "-");
    // Same env-aware resolution as TrajectoryRecorder, so EVAL_TRAJECTORY_ROOT
    // cannot split recorder- and adapter-persisted trajectories across roots.
    const root = opts.outputRoot ?? resolveTrajectoryRoot();
    const persisted = shouldPersistTrajectory(opts.persist);
    if (!persisted) {
        // Report the would-be path without reserving (nothing is written).
        return {
            directory: resolveTrajectoryDir(root, opts.taskSpec.id, runId),
            persisted: false,
        };
    }
    // Reserve atomically so a re-run or a concurrent same-timestamp run lands
    // beside the previous trajectory rather than overwriting it.
    const { directory, attempt } = await reserveTrajectoryDir(root, opts.taskSpec.id, runId);
    await writeTrajectoryDir(directory, opts.trajectory);
    await writeTrajectoryMetadata(directory, {
        task: opts.taskSpec.id,
        runId,
        runDir: path.basename(directory),
        attempt,
        status: opts.trajectory.status,
    });
    if (opts.evaluationResult) {
        await fs.writeFile(path.join(directory, "scores", "result.json"), JSON.stringify(opts.evaluationResult, null, 2));
        await fs.writeFile(path.join(directory, "task_data.json"), JSON.stringify({
            task: opts.trajectory.task,
            status: opts.trajectory.status,
            finalAnswer: opts.trajectory.finalAnswer ?? null,
            result: opts.evaluationResult,
        }, null, 2));
    }
    return { directory, persisted: true };
}
