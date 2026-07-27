/**
 * Filesystem-safe slug: collapse anything outside [A-Za-z0-9._-] to "_".
 *
 * Dots are whitelisted, so a pure-dot value survives as a path component: ".."
 * escapes the root, "." collapses the group into it. The group is caller-supplied,
 * so reject those; "" falls through to the "default" floor.
 */
export declare function sanitizeSlug(value: string): string;
/**
 * Sortable, collision-resistant token identifying one run, e.g.
 * "20260715-110342-9f3a1c2b4d6e8f01". Generate EXACTLY ONCE per run and reuse it;
 * calling it twice would split the run across two group dirs.
 *
 * Not an atomic group-dir reservation: reserving up front means creating
 * `<root>/<group>/` before any task runs, which would defeat writeExperimentLink's
 * "dir exists => something was recorded" check. Atomic reservation stays on the
 * per-trajectory leaf (`reserveTrajectoryDir`).
 */
export declare function generateRunToken(now?: Date, entropy?: string): string;
/**
 * Resolve the model that every model-backed testcase in a run actually uses.
 * A run-global model override is only a request and does not imply that the
 * generated testcase matrix ran that model, so ambiguous provenance is omitted.
 */
export declare function resolveUnambiguousModel(models: ReadonlyArray<string | undefined>): string | undefined;
/**
 * Build the run-scoped group slug. The experiment name is the floor; the model
 * is appended only when it is unambiguous for the run, and the run token last
 * so a re-run of the same suite gets its own group dir instead of overwriting
 * the previous run's `experiment.json`.
 */
export declare function buildTrajectoryGroupSlug(opts: {
    experimentName: string;
    model?: string;
    runToken?: string;
}): string;
/**
 * The group dir for the current run. Defaults to "default" when the entrypoint
 * hasn't stamped a group (e.g. ad-hoc scripts or unit tests) so trajectories are
 * always grouped — never scattered at the root.
 */
export declare function resolveTrajectoryGroup(): string;
/** The group's root dir: `<root>/<group>`. */
export declare function resolveTrajectoryGroupDir(root: string): string;
/**
 * Compute the trajectory output dir. Always grouped:
 * `<root>/<group>/<task.id>/<runId>`.
 */
export declare function resolveTrajectoryDir(root: string, taskId: string, runId: string, group?: string): string;
/**
 * Atomically reserve a trajectory dir, never overwriting a previous run.
 *
 * Starts from `<root>/<group>/<task.id>/<runId>` and creates the leaf with a
 * NON-recursive mkdir, which fails with EEXIST if the dir already exists. On
 * collision it retries with `<runId>-2`, `<runId>-3`, … until it wins one,
 * returning the reserved dir and its attempt number (1 for the un-suffixed
 * dir). The atomic create is the concurrency-safe part: two trials of the same
 * task that compute the same timestamp `runId` can't both win the same dir, so
 * neither silently clobbers the other — and a re-run reusing a fixed `runId`
 * lands beside the previous run instead of on top of it.
 */
export declare function reserveTrajectoryDir(root: string, taskId: string, runId: string, group?: string): Promise<{
    directory: string;
    attempt: number;
}>;
/**
 * Default trajectory root. Mirrors the recorder/persist default
 * (`<cwd>/.trajectories`) and honours an `EVAL_TRAJECTORY_ROOT` override so the
 * entrypoint writes the experiment link to the same place tasks write to.
 */
export declare function resolveTrajectoryRoot(): string;
/**
 * Write `<root>/<group>/experiment.json`, cross-linking local trajectories to the
 * resolved Braintrust experiment — known only after `Eval()` finishes, so this is a
 * one-time best-effort write from the entrypoint. `group` is explicit rather than
 * re-read from env, so the link lands on the group the caller recorded into.
 *
 * Skipped when persistence is off (nothing will be recorded) or the group dir is
 * missing (nothing was — covers core-only runs, non-agent categories and
 * all-failed runs without needing a tier signal), so no group is left holding
 * nothing but an experiment.json.
 */
export declare function writeExperimentLink(root: string, group: string, link: Record<string, unknown>, opts?: {
    persist?: boolean;
}): Promise<void>;
/** Run-level metadata captured from env, written alongside each trajectory. */
export declare function trajectoryRunMetadata(): Record<string, string>;
/**
 * Write `metadata.json` into a trajectory dir (best-effort). Records which run
 * the trajectory belongs to so it never has to be reverse-engineered. The
 * caller-supplied `extra` (e.g. timestamp) is merged over the env-derived base.
 */
export declare function writeTrajectoryMetadata(directory: string, extra?: Record<string, unknown>): Promise<void>;
