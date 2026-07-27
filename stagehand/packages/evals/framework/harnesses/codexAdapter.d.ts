/**
 * codexAdapter — converts a Codex SDK run into a `Trajectory` the verifier
 * can consume.
 *
 * Input shape: codex emits `ThreadEvent`s — `item.completed` carrying a
 * `ThreadItem` (command_execution, file_change, mcp_tool_call, agent_message,
 * reasoning, web_search, todo_list, error), plus `turn.completed` for usage.
 * We accumulate the full event list upstream in `runCodexAgent` and hand it
 * here.
 *
 * Mapping:
 *   - command_execution items → tool call named `bash` (or the command's
 *     leading token), args = { command }, result = aggregated_output,
 *     ok = exit_code === 0.
 *   - mcp_tool_call items → tool call named `${server}.${tool}`, args =
 *     arguments, result = structured_content (json modality) when present,
 *     else flattened content text. ok = status !== "failed".
 *   - reasoning items between item.completed events → folded into the next
 *     tool call's reasoning string.
 *   - agent_message items → the final answer (last wins).
 *   - error items → captured as a failed tool call so the verifier sees the
 *     pattern (a no-op `error` action with the message in toolOutput.error).
 *   - file_change items → captured as a tool call named `file_change` with the
 *     change set in args (rare in browser eval contexts).
 *   - web_search items → captured as a tool call named `web_search` with the
 *     query in args.
 *   - todo_list items → not surfaced as tool calls (they aren't actions).
 */
import type { TaskSpec, Trajectory } from "@browserbasehq/stagehand";
import { type TrajectoryAdapter } from "./trajectoryAdapter.js";
export interface CodexRunResult {
    /** All ThreadEvents collected from the SDK stream, in arrival order. */
    events: Array<Record<string, unknown>>;
    /** Last `agent_message` text. Adapter falls back to scanning events otherwise. */
    finalAnswer?: string;
    /** Trajectory-level status. Defaults to "complete". */
    status?: Trajectory["status"];
    /** Optional usage to fold into Trajectory.usage. */
    usage?: Partial<Trajectory["usage"]>;
}
export declare class CodexTrajectoryAdapter implements TrajectoryAdapter<CodexRunResult> {
    fromHarnessResult(result: CodexRunResult, taskSpec: TaskSpec): Trajectory;
}
export declare const codexAdapter: CodexTrajectoryAdapter;
