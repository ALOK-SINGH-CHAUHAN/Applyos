import { resolveWsTargetFromPort } from "./local-cdp-discovery.js";
const DEFAULT_HTTP_TIMEOUT_MS = 2_000;
export async function resolveWsTarget(input, options = {}) {
    if (/^\d+$/.test(input)) {
        return resolveWsTargetFromPort(Number.parseInt(input, 10), options);
    }
    if (input.startsWith("http://") || input.startsWith("https://")) {
        const versionUrl = new URL("/json/version", input);
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), options.httpTimeoutMs ?? DEFAULT_HTTP_TIMEOUT_MS);
        try {
            const response = await fetch(versionUrl, {
                headers: { accept: "application/json" },
                signal: controller.signal,
            });
            if (!response.ok) {
                throw new Error(`Unable to resolve CDP endpoint from ${input}: HTTP ${response.status}`);
            }
            const payload = (await response.json());
            if (!payload.webSocketDebuggerUrl) {
                throw new Error(`Unable to resolve CDP endpoint from ${input}: missing webSocketDebuggerUrl`);
            }
            return payload.webSocketDebuggerUrl;
        }
        catch (error) {
            if (error instanceof Error && error.name === "AbortError") {
                throw new Error(`Timed out resolving CDP endpoint from ${input}.`, {
                    cause: error,
                });
            }
            throw error;
        }
        finally {
            clearTimeout(timer);
        }
    }
    return input;
}
