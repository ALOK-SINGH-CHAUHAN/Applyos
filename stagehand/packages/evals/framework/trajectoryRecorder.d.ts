import type { AgentEvidenceEvent, TaskSpec, Trajectory, TrajectoryStatus, TrajectoryUsage, EvaluationResult } from "@browserbasehq/stagehand";
export interface TrajectoryRecorderOptions {
    taskSpec: TaskSpec;
    /**
     * Root directory under which trajectory dirs are written. The on-disk layout
     * is `<root>/<group>/<task.id>/<runId>/`, where <group> is the run-scoped
     * EVAL_TRAJECTORY_GROUP (experiment+model) or "default".
     * Defaults to `<cwd>/.trajectories`.
     */
    outputRoot?: string;
    /** Run identifier (e.g., ISO timestamp + env). Defaults to a fresh timestamp. */
    runId?: string;
    /**
     * Override the env-gated persistence default. `true` always persists,
     * `false` never does, `undefined` defers to VERIFIER_PERSIST_TRAJECTORIES.
     */
    persist?: boolean;
}
export interface TrajectoryFinishOptions {
    status: TrajectoryStatus;
    finalAnswer?: string;
    usage?: Partial<TrajectoryUsage>;
}
export declare class TrajectoryRecorder {
    private readonly taskSpec;
    private readonly runId;
    private readonly outputRoot;
    private readonly group;
    private reservation?;
    private outputDir;
    private readonly persistEnabled;
    private readonly steps;
    private latestAgentScreenshot?;
    private pendingProbeScreenshot?;
    private stepsAwaitingProbe;
    private finalAnswerEvent?;
    private finalObservation?;
    private onScreenshot;
    private onStepFinished;
    private onStepObserved;
    private onFinalAnswer;
    constructor(opts: TrajectoryRecorderOptions);
    /** Ingest an evidence callback event from agent.execute(). */
    record(event: AgentEvidenceEvent): void;
    /**
     * Detach listeners, assemble the Trajectory, and (if persistence is on)
     * write the on-disk layout. Idempotent.
     */
    finish(opts: TrajectoryFinishOptions): Promise<Trajectory>;
    /** Throw away in-memory state without writing to disk. Used on early abort. */
    cancel(): void;
    /** Where the trajectory dir lives (whether or not it was persisted). */
    get directory(): string;
    /** Whether this recorder wrote the trajectory directory on finish(). */
    get persisted(): boolean;
    /**
     * Reserve this recorder's on-disk directory exactly once. Reserved at first
     * persistence rather than construction, so collision resolution sees dirs
     * concurrent recorders have actually created; caching keeps finish() idempotent
     * and makes finish()/persistResult() order-free.
     */
    private ensureReserved;
    /**
     * Persist evaluator result next to the trajectory. No-op when trajectory
     * persistence is disabled.
     */
    persistResult(result: EvaluationResult, filename?: string): Promise<void>;
}
