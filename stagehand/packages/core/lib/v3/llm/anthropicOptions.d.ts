/**
 * Anthropic model capabilities + typed provider options for the agent paths.
 *
 * Adaptive thinking (`thinking: { type: "adaptive" }` + `effort`) is the
 * recommended thinking mode on Claude 4.6+ models and the only mode on
 * Opus 4.7/4.8; on Claude Fable 5 thinking is always on and adaptive is the
 * only mode. The CUA path (AnthropicCUAClient) sets the raw Messages API
 * fields directly; the hybrid/DOM path goes through @ai-sdk/anthropic, which
 * maps the typed provider options below to the same API fields.
 *
 * Fable 5 may decline a turn (stop_reason "refusal"). The `fallbacks`
 * provider option opts into the API's built-in server-side fallback: the API
 * retries a declined turn on the fallback model and returns one response.
 * @ai-sdk/anthropic adds the required server-side-fallback beta header
 * automatically when `fallbacks` is set.
 */
import type { JSONValue } from "@ai-sdk/provider";
import type { ThinkingEffort } from "../types/public/model.js";
/**
 * Shape accepted by the AI SDK's per-provider `providerOptions` maps. The
 * helpers below build values as typed `AnthropicProviderOptions` (so field
 * names stay checked) and return them under this JSON-compatible alias so
 * call sites need no casts.
 */
export type AnthropicAgentProviderOptions = Record<string, JSONValue>;
export declare const ANTHROPIC_FABLE_5_FALLBACK_MODEL_ID: "claude-opus-4-8";
/** True for Anthropic models that support adaptive thinking. */
export declare function isAdaptiveThinkingAnthropicModel(modelId: string): boolean;
export declare function isAnthropicFable5Model(modelId: string): boolean;
/**
 * True for models that reject forced tool use
 * (`tool_choice: { type: "tool" }`). Forced tool choice is incompatible with
 * active extended thinking, and on Fable 5 thinking is always on — so the
 * rejection is a certainty there, not a transient quirk.
 */
export declare function rejectsForcedToolUse(modelId: string): boolean;
/** Default adaptive effort on both agent paths (CUA and hybrid/DOM),
 * overridable per client via `thinkingEffort`. */
export declare const DEFAULT_ANTHROPIC_ADAPTIVE_EFFORT: Exclude<ThinkingEffort, "none">;
/**
 * Resolve the adaptive effort to send, clamped to what the model accepts.
 * Precedence: the client's `thinkingEffort` > the shared default ("medium").
 * "none" is handled by the callers: it means "do not request thinking at
 * all", not an effort level.
 */
export declare function resolveAdaptiveEffort(modelId: string, explicit?: string): Exclude<ThinkingEffort, "none">;
/**
 * Typed `anthropic` provider options requesting adaptive thinking for models
 * that support it, or `undefined` otherwise.
 */
export declare function anthropicAdaptiveThinkingOptions(modelId: string, effort?: string): AnthropicAgentProviderOptions | undefined;
/**
 * Typed `anthropic` provider options enabling the API's server-side refusal
 * fallback for Fable 5, or `undefined` for other models. The provider adds
 * the server-side-fallback beta header automatically.
 */
export declare function anthropicFallbacksOptions(modelId: string): AnthropicAgentProviderOptions | undefined;
