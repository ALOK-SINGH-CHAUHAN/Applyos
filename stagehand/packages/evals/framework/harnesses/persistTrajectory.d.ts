import type { EvaluationResult, TaskSpec, Trajectory } from "@browserbasehq/stagehand";
export interface PersistAdapterTrajectoryOptions {
    trajectory: Trajectory;
    taskSpec: TaskSpec;
    /** EvaluationResult from V3Evaluator.verify(). Written to scores/result.json. */
    evaluationResult?: EvaluationResult;
    /**
     * Output directory root. Final layout lives at
     * `<outputRoot>/<group>/<task.id>/<runId>/`. Entrypoints normally generate
     * `<experiment>[__<model>]__<runToken>` (model only when unambiguous), but
     * integrations may set EVAL_TRAJECTORY_GROUP to any value.
     * Defaults to `<cwd>/.trajectories`.
     */
    outputRoot?: string;
    /** Run identifier (e.g., ISO timestamp). Defaults to a fresh timestamp. */
    runId?: string;
    /**
     * Override the env-gated persistence default. `true` always persists,
     * `false` never does, `undefined` defers to VERIFIER_PERSIST_TRAJECTORIES.
     */
    persist?: boolean;
}
export interface PersistAdapterTrajectoryResult {
    /** The directory the trajectory was (or would have been) persisted to. */
    directory: string;
    /** Whether persistence actually wrote files. */
    persisted: boolean;
}
/**
 * Persist a trajectory produced by an external-harness adapter (claude_code,
 * codex). External harnesses produce a complete Trajectory synchronously
 * rather than streaming bus events, so they bypass TrajectoryRecorder and
 * call writeTrajectoryDir directly. The evaluationResult, if supplied, is
 * also written under scores/result.json and merged into task_data.json.
 */
export declare function persistAdapterTrajectory(opts: PersistAdapterTrajectoryOptions): Promise<PersistAdapterTrajectoryResult>;
