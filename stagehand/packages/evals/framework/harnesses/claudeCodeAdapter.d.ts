/**
 * claudeCodeAdapter — converts a Claude Code SDK run into a `Trajectory` the
 * verifier can consume.
 *
 * Input shape: the SDK emits a stream of `ClaudeSdkMessage` objects of
 * different `type`s — assistant (model output, may contain tool_use blocks),
 * user (tool_result blocks for prior tool_use calls), and result (final
 * outcome with cost/usage/turn counts). We accumulate the stream upstream in
 * `runClaudeCodeAgent` and hand the full list here.
 *
 * Mapping:
 *   - Each `tool_use` block in an assistant message becomes one normalized
 *     tool call, paired with its matching `tool_result` from a subsequent
 *     user message (by `tool_use_id`).
 *   - Assistant `text` blocks that precede a tool_use are folded into that
 *     tool call's `reasoning`. Trailing text after the last tool call (and
 *     the final result message's `result` string when present) becomes the
 *     `finalAnswer`.
 *   - The result message's usage carries forward as the trajectory usage.
 *
 * Failure modes:
 *   - max_turns / sdk_error → status = "error", but we still emit whatever
 *     steps we have. The verifier flags evidence_insufficient on criteria it
 *     can't ground.
 */
import type { TaskSpec, Trajectory } from "@browserbasehq/stagehand";
import { type TrajectoryAdapter } from "./trajectoryAdapter.js";
/** Subset of the harness result we need to build a trajectory. */
export interface ClaudeCodeRunResult {
    /** Raw SDK message stream collected during execution, in arrival order. */
    messages: Array<Record<string, unknown>>;
    /** Final assistant message captured separately (optional — falls back to messages). */
    finalAnswer?: string;
    /** Trajectory-level status. Defaults to "complete". */
    status?: Trajectory["status"];
    /** Optional usage to fold into Trajectory.usage. */
    usage?: Partial<Trajectory["usage"]>;
}
export declare class ClaudeCodeTrajectoryAdapter implements TrajectoryAdapter<ClaudeCodeRunResult> {
    fromHarnessResult(result: ClaudeCodeRunResult, taskSpec: TaskSpec): Trajectory;
}
export declare const claudeCodeAdapter: ClaudeCodeTrajectoryAdapter;
