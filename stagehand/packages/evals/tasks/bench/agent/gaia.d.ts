/**
 * Data-driven GAIA agent eval.
 *
 * Per-test params (injected via the eval runner):
 *   { id, level, web, ques, expected? }
 *
 * Starts at `web`, runs the agent with `ques` as the instruction. The
 * verifier scores against a single criterion that checks the final answer
 * against `expected` when present; otherwise falls back to a generic
 * "did the agent complete this task?" criterion.
 */
declare const _default: import("../../../framework/types.js").TaskDefinition;
export default _default;
