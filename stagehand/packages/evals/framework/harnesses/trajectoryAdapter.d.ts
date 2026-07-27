import type { AgentEvidence, ProbeEvidence, TaskSpec, Trajectory, TrajectoryStep } from "@browserbasehq/stagehand";
/**
 * Pure converter from a harness-specific result to a verifier Trajectory.
 * Implementations must be deterministic (no I/O, no mutation of input).
 * Empty `probeEvidence` is allowed — the verifier degrades via the
 * `evidence_insufficient` path; visual-grounding criteria are flagged
 * rather than silently miscredited.
 */
export interface TrajectoryAdapter<THarnessResult> {
    fromHarnessResult(result: THarnessResult, taskSpec: TaskSpec): Trajectory;
}
/**
 * Canonical tool invocation; harnesses parse their event/message logs into
 * this shape before mapping to a TrajectoryStep.
 */
export interface NormalizedToolCall {
    /** Tool name (e.g., "Bash", "mcp__stagehand_browser__run", "container.exec"). */
    name: string;
    /** Tool arguments. Empty object if the harness doesn't surface them. */
    args: Record<string, unknown>;
    /**
     * Tool result. Strings become a text modality; objects become a json modality.
     * `undefined` is allowed (e.g., when the tool failed before producing output).
     */
    result: unknown;
    /** True if the tool reported success. Adapters infer this from harness flags. */
    ok: boolean;
    /** Free-form error string when `ok === false`. */
    error?: string;
    /** Optional reasoning text the assistant emitted before/with this tool call. */
    reasoning?: string;
    /**
     * Optional image evidence the tool returned (e.g., screenshots from a
     * playwright_code tool). Folded into agentEvidence as image modalities so
     * the verifier can ground visual criteria against them.
     */
    images?: Array<{
        bytes: Buffer;
        mediaType: string;
    }>;
}
/**
 * Convert a NormalizedToolCall into a Trajectory AgentEvidence. Objects
 * yield both a json modality (structure-preserving) and a stringified text
 * modality (cheap fallback for text-only prompts). probeEvidence is left
 * to the caller — external harnesses don't emit independent observations.
 */
export declare function actionToAgentEvidence(call: Pick<NormalizedToolCall, "result" | "reasoning" | "images">): AgentEvidence;
export declare function toolCallToTrajectoryStep(call: NormalizedToolCall): TrajectoryStep;
/**
 * Build a `Trajectory` from a sequence of normalized tool calls + the task
 * metadata. Adapters call this after parsing their harness's event log.
 */
export interface BuildTrajectoryOptions {
    taskSpec: TaskSpec;
    toolCalls: NormalizedToolCall[];
    finalAnswer?: string;
    status?: Trajectory["status"];
    /** Token usage if the harness surfaced it; partial fields are filled with 0. */
    usage?: Partial<Trajectory["usage"]>;
    /**
     * Terminal observation evidence (typically the last screenshot the agent
     * captured). The verifier anchors this as the closing frame of the
     * trajectory — see core/lib/v3/verifier/evidence.ts. External harnesses that
     * have no post-task probe path can pass the final tool_result screenshot
     * here to preserve the legacy final-screenshot verification behavior.
     */
    finalObservation?: ProbeEvidence;
}
export declare function buildTrajectory(opts: BuildTrajectoryOptions): Trajectory;
