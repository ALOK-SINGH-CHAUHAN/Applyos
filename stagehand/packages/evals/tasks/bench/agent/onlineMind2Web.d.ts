/**
 * OnlineMind2Web bench task.
 *
 * Runs through TrajectoryRecorder + V3Evaluator.verify(). Unlike WebTailBench,
 * Mind2Web doesn't ship rubrics; the verifier generates one on first encounter
 * per task id and caches under packages/evals/.rubric-cache/onlineMind2Web/.
 * Cached rubrics hydrate on subsequent runs.
 *
 * --success knob: defaults to "outcome".
 * Override via the EVAL_SUCCESS_MODE env var (set by the bench runner's
 * --success flag): outcome | process | both.
 */
declare const _default: import("../../../framework/types.js").TaskDefinition;
export default _default;
