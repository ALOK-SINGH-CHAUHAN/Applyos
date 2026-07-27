/**
 * Convert a NormalizedToolCall into a Trajectory AgentEvidence. Objects
 * yield both a json modality (structure-preserving) and a stringified text
 * modality (cheap fallback for text-only prompts). probeEvidence is left
 * to the caller — external harnesses don't emit independent observations.
 */
export function actionToAgentEvidence(call) {
    const modalities = [];
    if (call.reasoning) {
        modalities.push({ type: "text", content: call.reasoning });
    }
    const result = call.result;
    if (result !== undefined && result !== null) {
        if (typeof result === "string") {
            if (result.length > 0) {
                modalities.push({ type: "text", content: result });
            }
        }
        else if (Buffer.isBuffer(result)) {
            modalities.push({
                type: "image",
                bytes: result,
                mediaType: "image/png",
            });
        }
        else if (typeof result === "object") {
            // Provide both a JSON modality (preserved structure for prompts that
            // accept JSON) and a stringified text modality (cheap fallback for prompts
            // that only consume text). Step 2 relevance scoring tolerates duplicates.
            modalities.push({ type: "json", content: result });
            const asText = safeStringify(result);
            if (asText) {
                modalities.push({ type: "text", content: asText });
            }
        }
        else {
            // Numbers, booleans, etc. — stringify so the verifier has a text handle.
            modalities.push({ type: "text", content: String(result) });
        }
    }
    if (call.images?.length) {
        for (const image of call.images) {
            modalities.push({
                type: "image",
                bytes: image.bytes,
                mediaType: image.mediaType,
            });
        }
    }
    return { modalities };
}
export function toolCallToTrajectoryStep(call) {
    return {
        actionName: call.name,
        actionArgs: call.args,
        reasoning: call.reasoning ?? "",
        agentEvidence: actionToAgentEvidence(call),
        // External harnesses don't natively produce screenshots/aria/scroll, so
        // probeEvidence stays empty. The verifier handles this via the
        // evidence_insufficient path.
        probeEvidence: {},
        toolOutput: {
            ok: call.ok,
            result: call.result,
            ...(call.error && { error: call.error }),
        },
    };
}
export function buildTrajectory(opts) {
    const steps = opts.toolCalls.map((call) => toolCallToTrajectoryStep(call));
    return {
        task: opts.taskSpec,
        steps,
        finalAnswer: opts.finalAnswer,
        status: opts.status ?? "complete",
        ...(opts.finalObservation && { finalObservation: opts.finalObservation }),
        usage: {
            input_tokens: opts.usage?.input_tokens ?? 0,
            output_tokens: opts.usage?.output_tokens ?? 0,
            ...(opts.usage?.reasoning_tokens !== undefined && {
                reasoning_tokens: opts.usage.reasoning_tokens,
            }),
            ...(opts.usage?.cached_input_tokens !== undefined && {
                cached_input_tokens: opts.usage.cached_input_tokens,
            }),
            ...(opts.usage?.inference_time_ms !== undefined && {
                inference_time_ms: opts.usage.inference_time_ms,
            }),
        },
    };
}
function safeStringify(value) {
    try {
        return JSON.stringify(value);
    }
    catch {
        return undefined;
    }
}
