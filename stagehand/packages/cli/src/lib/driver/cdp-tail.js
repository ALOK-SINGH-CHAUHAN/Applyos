import WebSocket from "ws";
import { resolveWsTarget } from "./resolve-ws.js";
export const DEFAULT_CDP_DOMAINS = [
    "Network",
    "Console",
    "Runtime",
    "Log",
    "Page",
];
export async function tailCdp(target, options = {}) {
    const wsUrl = await resolveWsTarget(target);
    const domains = options.domains?.length
        ? options.domains
        : DEFAULT_CDP_DOMAINS;
    const usePretty = options.pretty ?? false;
    let messageId = 1;
    const pendingIds = new Set();
    const targetSessionMap = new Map();
    function send(ws, method, params = {}, sessionId) {
        const id = messageId++;
        pendingIds.add(id);
        const message = { id, method, params };
        if (sessionId)
            message.sessionId = sessionId;
        ws.send(JSON.stringify(message));
        return id;
    }
    function enableDomains(ws, sessionId) {
        for (const domain of domains) {
            if (domain === "Network") {
                send(ws, "Network.enable", { maxResourceBufferSize: 100_000, maxTotalBufferSize: 1_000_000 }, sessionId);
            }
            else {
                send(ws, `${domain}.enable`, {}, sessionId);
            }
            if (domain === "Page") {
                send(ws, "Page.setLifecycleEventsEnabled", { enabled: true }, sessionId);
            }
        }
    }
    await new Promise((resolve) => {
        const ws = new WebSocket(wsUrl);
        let closed = false;
        const cleanup = () => {
            if (closed)
                return;
            closed = true;
            if (ws.readyState === WebSocket.OPEN ||
                ws.readyState === WebSocket.CONNECTING) {
                ws.close();
            }
            resolve();
        };
        process.once("SIGINT", cleanup);
        process.once("SIGTERM", cleanup);
        ws.on("open", () => {
            if (usePretty) {
                process.stderr.write(`Connected to ${wsUrl}\n`);
            }
            send(ws, "Target.setAutoAttach", {
                autoAttach: true,
                filter: [{ type: "page" }],
                flatten: true,
                waitForDebuggerOnStart: false,
            });
            send(ws, "Target.setDiscoverTargets", {
                discover: true,
                filter: [{ type: "page" }],
            });
        });
        ws.on("message", (raw) => {
            let message;
            try {
                message = JSON.parse(raw.toString());
            }
            catch {
                return;
            }
            if (message.id !== undefined && pendingIds.has(message.id)) {
                pendingIds.delete(message.id);
                if (message.error) {
                    process.stderr.write(`CDP error (id=${message.id}): ${message.error.message}\n`);
                }
                return;
            }
            if (message.method === "Target.attachedToTarget" && message.params) {
                const params = message.params;
                if (params.sessionId &&
                    params.targetInfo?.type === "page" &&
                    params.targetInfo.targetId) {
                    targetSessionMap.set(params.targetInfo.targetId, params.sessionId);
                    enableDomains(ws, params.sessionId);
                }
            }
            if (message.method === "Target.detachedFromTarget" && message.params) {
                const params = message.params;
                const targetId = params.targetId ??
                    [...targetSessionMap.entries()].find(([, sessionId]) => sessionId === params.sessionId)?.[0];
                if (targetId)
                    targetSessionMap.delete(targetId);
            }
            writeCdpMessage(message, usePretty);
        });
        ws.on("error", (error) => {
            process.stderr.write(`Error: ${error.message}\n`);
        });
        ws.on("close", () => {
            if (!closed && usePretty) {
                process.stderr.write("Disconnected.\n");
            }
            cleanup();
        });
    });
}
function writeCdpMessage(message, pretty) {
    if (!pretty) {
        writeLine(JSON.stringify(message));
        return;
    }
    const line = formatPrettyCdpMessage(message);
    if (line)
        writeLine(line);
}
function writeLine(line) {
    try {
        process.stdout.write(`${line}\n`);
    }
    catch (error) {
        if (error.code === "EPIPE")
            process.exit(0);
        throw error;
    }
}
function formatPrettyCdpMessage(message) {
    if (!message.method)
        return null;
    const params = message.params;
    let line = `[${message.method}]`;
    try {
        if (message.method === "Network.requestWillBeSent") {
            const request = params?.request;
            if (request)
                line += ` ${request.method ?? "?"} ${request.url ?? ""}`;
        }
        else if (message.method === "Network.responseReceived") {
            const response = params?.response;
            if (response)
                line += ` ${response.status ?? "?"} ${response.url ?? ""}`;
        }
        else if (message.method === "Network.loadingFailed") {
            line += ` ${params?.errorText ?? "Unknown error"}`;
        }
        else if (message.method === "Runtime.consoleAPICalled") {
            const type = params?.type ?? "log";
            const args = params?.args ?? [];
            line += ` [${type}] ${args.map((arg) => arg.description ?? arg.value ?? "").join(" ")}`;
        }
        else if (message.method === "Runtime.exceptionThrown") {
            const detail = params?.exceptionDetails;
            line += ` ${detail?.exception?.description ?? detail?.text ?? "Unknown exception"}`;
        }
        else if (message.method === "Page.frameNavigated") {
            const url = params?.frame?.url;
            if (url)
                line += ` ${url}`;
        }
        else if (message.method === "Page.lifecycleEvent") {
            const name = params?.name;
            if (name)
                line += ` ${name}`;
        }
        else if (message.method === "Target.attachedToTarget") {
            const info = params?.targetInfo;
            if (info)
                line += ` [${info.type ?? "?"}] ${info.url ?? ""}`;
        }
    }
    catch {
        return `[${message.method}]`;
    }
    return line;
}
