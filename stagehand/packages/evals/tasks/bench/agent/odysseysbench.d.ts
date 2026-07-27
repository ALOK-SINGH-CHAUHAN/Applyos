/**
 * OdysseysBench bench task.
 *
 * OdysseysBench (https://odysseysbench.com) is a 200-task web-agent benchmark
 * (45 easy / 46 medium / 109 hard). Every task ships a weighted rubric, baked
 * into `precomputed_rubric` by scripts/build-odysseysbench-dataset.ts, so the
 * verifier scores process + outcome against the published criteria directly.
 *
 * Runs the agent through TrajectoryRecorder + V3Evaluator.verify() like the
 * other rubric-bearing suites (WebTailBench).
 *
 * --success knob: defaults to "outcome".
 * Override via the EVAL_SUCCESS_MODE env var: outcome | process | both.
 */
declare const _default: import("../../../framework/types.js").TaskDefinition;
export default _default;
