/**
 * WebVoyager bench task.
 *
 * Runs through TrajectoryRecorder + V3Evaluator.verify(). WebVoyager doesn't
 * ship precomputed rubrics, so the verifier generates one on first encounter
 * per task id and caches under packages/evals/.rubric-cache/webvoyager/.
 *
 * --success knob: defaults to "outcome".
 * Override via the EVAL_SUCCESS_MODE env var: outcome | process | both.
 */
declare const _default: import("../../../framework/types.js").TaskDefinition;
export default _default;
