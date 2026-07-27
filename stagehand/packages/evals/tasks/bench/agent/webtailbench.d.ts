/**
 * WebTailBench bench task.
 *
 * Runs the agent through TrajectoryRecorder + V3Evaluator.verify() so process
 * and outcome scoring are grounded in saved trajectory evidence.
 *
 * If a row does not carry `precomputed_rubric`, the verifier generates a
 * rubric on first encounter per task id and caches it under
 * packages/evals/.rubric-cache/webtailbench/.
 *
 * --success knob: defaults to "outcome".
 * Override via the EVAL_SUCCESS_MODE env var: outcome | process | both.
 */
declare const _default: import("../../../framework/types.js").TaskDefinition;
export default _default;
