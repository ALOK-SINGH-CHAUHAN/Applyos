import { buildTrajectory, } from "./trajectoryAdapter.js";
export class CodexTrajectoryAdapter {
    fromHarnessResult(result, taskSpec) {
        const toolCalls = [];
        let pendingReasoning = "";
        let latestAgentMessage;
        for (const event of result.events) {
            const type = String(event.type ?? "");
            if (type !== "item.completed")
                continue;
            const item = event.item;
            if (!isRecord(item))
                continue;
            const itemType = String(item.type ?? "");
            if (itemType === "reasoning" && typeof item.text === "string") {
                pendingReasoning = pendingReasoning
                    ? `${pendingReasoning}\n${item.text}`
                    : item.text;
                continue;
            }
            if (itemType === "agent_message" && typeof item.text === "string") {
                // Drop buffered reasoning that didn't precede a tool call.
                pendingReasoning = "";
                latestAgentMessage = item.text;
                continue;
            }
            const call = normalizeItem(itemType, item, pendingReasoning);
            if (call) {
                toolCalls.push(call);
                pendingReasoning = "";
            }
        }
        const finalAnswer = result.finalAnswer ?? latestAgentMessage;
        return buildTrajectory({
            taskSpec,
            toolCalls,
            finalAnswer,
            status: result.status ?? "complete",
            usage: result.usage,
        });
    }
}
export const codexAdapter = new CodexTrajectoryAdapter();
function normalizeItem(itemType, item, reasoning) {
    if (itemType === "command_execution") {
        const command = typeof item.command === "string" ? item.command : "";
        const exitCode = typeof item.exit_code === "number" ? item.exit_code : undefined;
        const status = String(item.status ?? "");
        const ok = exitCode === 0 || status === "completed";
        const output = typeof item.aggregated_output === "string" ? item.aggregated_output : "";
        // Use the leading token as the action name (`bash`, `browse`, etc.) when
        // possible; falls back to `command_execution`.
        const leading = command.split(/\s+/, 1)[0] || "command_execution";
        return {
            name: leading,
            args: { command, ...(exitCode !== undefined && { exit_code: exitCode }) },
            result: output,
            ok,
            ...(!ok && {
                error: exitCode !== undefined
                    ? `exit code ${exitCode}`
                    : `command status ${status}`,
            }),
            reasoning: reasoning || undefined,
        };
    }
    if (itemType === "mcp_tool_call") {
        const server = typeof item.server === "string" ? item.server : "mcp";
        const tool = typeof item.tool === "string" ? item.tool : "tool";
        const args = isRecord(item.arguments)
            ? item.arguments
            : {};
        const status = String(item.status ?? "");
        const ok = status !== "failed";
        const mcpResult = isRecord(item.result) ? item.result : undefined;
        const structured = mcpResult?.structured_content;
        const content = mcpResult?.content;
        const errorMessage = isRecord(item.error)
            ? typeof item.error.message === "string"
                ? item.error.message
                : undefined
            : undefined;
        // Prefer structured_content (json modality) when present, else flatten
        // content blocks to text. Falls back to error message when failed.
        let payload;
        if (structured !== undefined && structured !== null) {
            payload = structured;
        }
        else if (Array.isArray(content)) {
            const parts = [];
            for (const block of content) {
                if (!isRecord(block))
                    continue;
                if (block.type === "text" && typeof block.text === "string") {
                    parts.push(block.text);
                }
                else if (block.type === "image") {
                    parts.push("[image]");
                }
                else if (typeof block.text === "string") {
                    parts.push(block.text);
                }
            }
            payload = parts.join("\n");
        }
        else if (!ok && errorMessage) {
            payload = errorMessage;
        }
        else {
            payload = "";
        }
        return {
            name: `${server}.${tool}`,
            args,
            result: payload,
            ok,
            ...(errorMessage && !ok && { error: errorMessage }),
            reasoning: reasoning || undefined,
        };
    }
    if (itemType === "web_search") {
        const query = typeof item.query === "string" ? item.query : "";
        return {
            name: "web_search",
            args: { query },
            result: "",
            ok: true,
            reasoning: reasoning || undefined,
        };
    }
    if (itemType === "file_change") {
        const changes = Array.isArray(item.changes) ? item.changes : [];
        const status = String(item.status ?? "");
        return {
            name: "file_change",
            args: { changes },
            result: { status, changes },
            ok: status === "completed",
            reasoning: reasoning || undefined,
        };
    }
    if (itemType === "error") {
        const message = typeof item.message === "string" ? item.message : "codex error item";
        return {
            name: "error",
            args: {},
            result: message,
            ok: false,
            error: message,
            reasoning: reasoning || undefined,
        };
    }
    return undefined;
}
function isRecord(value) {
    return typeof value === "object" && value !== null;
}
