import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
// =============================================================================
// HTTP Status Codes
// =============================================================================
export const HTTP_OK = 200;
export const HTTP_BAD_REQUEST = 400;
export const HTTP_NOT_FOUND = 404;
export const HTTP_GONE = 410;
export const HTTP_UNPROCESSABLE_ENTITY = 422;
export const HTTP_INTERNAL_SERVER_ERROR = 500;
// =============================================================================
// Timing Constants
// =============================================================================
export const SESSION_CLOSE_WAIT_MS = 2000;
const SESSION_START_RETRY_DELAY_MS = 500;
const SESSION_START_MAX_ATTEMPTS = (() => {
    const parsed = Number(process.env.STAGEHAND_TEST_SESSION_START_MAX_ATTEMPTS);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 3;
})();
// =============================================================================
// Environment Variables
// =============================================================================
export const { STAGEHAND_BASE_URL, STAGEHAND_API_URL, OPENAI_API_KEY, GEMINI_API_KEY, ANTHROPIC_API_KEY, } = process.env;
// =============================================================================
// Utility Functions
// =============================================================================
export function requireEnv(name, value) {
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}
export function getBaseUrl() {
    return STAGEHAND_API_URL ?? STAGEHAND_BASE_URL ?? "http://127.0.0.1:3107";
}
// =============================================================================
// Header Generators
// =============================================================================
export function getHeaders(sdkVersion, language = "typescript") {
    return {
        "Content-Type": "application/json",
        "x-model-api-key": requireEnv("OPENAI_API_KEY", OPENAI_API_KEY),
        "x-language": language,
        "x-sdk-version": sdkVersion,
    };
}
const SESSION_READY_DELAY_MS = 250;
const LOCAL_CONNECT_TIMEOUT_MS = (() => {
    const parsed = Number(process.env.STAGEHAND_TEST_LOCAL_CONNECT_TIMEOUT_MS);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 60_000;
})();
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function createLocalBrowserBody() {
    const resolveChromePath = () => {
        const explicit = process.env.CHROME_PATH;
        if (explicit && fs.existsSync(explicit)) {
            return explicit;
        }
        if (explicit) {
            throw new Error(`CHROME_PATH does not exist: ${explicit}`);
        }
        const playwrightPath = chromium.executablePath();
        if (playwrightPath && fs.existsSync(playwrightPath)) {
            return playwrightPath;
        }
        throw new Error("Unable to locate a Chrome executable. Set CHROME_PATH in the test environment.");
    };
    return {
        browser: {
            type: "local",
            launchOptions: {
                headless: true,
                executablePath: resolveChromePath(),
                args: process.env.CI ? ["--no-sandbox"] : undefined,
                connectTimeoutMs: LOCAL_CONNECT_TIMEOUT_MS,
            },
        },
    };
}
export const LOCAL_BROWSER_BODY = createLocalBrowserBody();
function readLaunchDiagnostics(launchOptions) {
    const diagnostics = [];
    const userDataDir = launchOptions?.userDataDir;
    diagnostics.push("--- launch diagnostics ---");
    diagnostics.push(`CHROME_PATH env: ${process.env.CHROME_PATH ?? "<unset>"}`);
    diagnostics.push(`CI env: ${process.env.CI ?? "<unset>"}`);
    diagnostics.push(`userDataDir: ${userDataDir ?? "<auto>"}`);
    if (!userDataDir) {
        diagnostics.push("chrome stdout/stderr logs unavailable (profile dir auto-managed by server launch)");
    }
    else {
        diagnostics.push(`userDataDir exists: ${fs.existsSync(userDataDir)}`);
        if (fs.existsSync(userDataDir)) {
            const outPath = path.join(userDataDir, "chrome-out.log");
            const errPath = path.join(userDataDir, "chrome-err.log");
            if (fs.existsSync(outPath)) {
                diagnostics.push(`--- chrome stdout ---\n${fs.readFileSync(outPath, "utf8")}`);
            }
            if (fs.existsSync(errPath)) {
                diagnostics.push(`--- chrome stderr ---\n${fs.readFileSync(errPath, "utf8")}`);
            }
        }
    }
    if (launchOptions) {
        diagnostics.push(`launch.executablePath: ${launchOptions.executablePath ?? "<unset>"}`);
        diagnostics.push(`launch.executablePath exists: ${launchOptions.executablePath
            ? fs.existsSync(launchOptions.executablePath)
            : false}`);
        diagnostics.push(`launch.headless: ${String(launchOptions.headless)}`);
        diagnostics.push(`launch.args: ${JSON.stringify(launchOptions.args ?? [])}`);
        diagnostics.push(`launch.port: ${launchOptions.port ?? "<auto>"}`);
        diagnostics.push(`launch.connectTimeoutMs: ${launchOptions.connectTimeoutMs ?? "<default>"}`);
    }
    return diagnostics.join("\n");
}
export async function createSession(headers) {
    const info = await createSessionWithCdp(headers);
    return info.sessionId;
}
export async function createSessionWithCdp(headers) {
    const url = getBaseUrl();
    const startPayload = {
        modelName: "gpt-4.1-nano",
        ...createLocalBrowserBody(),
    };
    let lastError;
    for (let attempt = 1; attempt <= SESSION_START_MAX_ATTEMPTS; attempt += 1) {
        const response = await fetch(`${url}/v1/sessions/start`, {
            method: "POST",
            headers,
            body: JSON.stringify(startPayload),
        });
        const responseText = await response.text();
        let parsedBody;
        try {
            parsedBody = responseText ? JSON.parse(responseText) : null;
        }
        catch {
            parsedBody = responseText;
        }
        const body = parsedBody;
        if (response.ok && body?.success) {
            if (!body.data?.available) {
                throw new Error("Session not available");
            }
            if (!body.data.sessionId) {
                throw new Error("No sessionId returned");
            }
            if (!body.data.cdpUrl) {
                throw new Error("No cdpUrl returned");
            }
            // Wait for session to be fully ready before returning
            await sleep(SESSION_READY_DELAY_MS);
            return {
                sessionId: body.data.sessionId,
                cdpUrl: body.data.cdpUrl,
            };
        }
        lastError = new Error(`Failed to create session (status=${response.status}): ${JSON.stringify(parsedBody)}\n${readLaunchDiagnostics(startPayload.browser?.launchOptions)}`);
        const shouldRetry = response.status === HTTP_INTERNAL_SERVER_ERROR &&
            attempt < SESSION_START_MAX_ATTEMPTS;
        if (!shouldRetry) {
            throw lastError;
        }
        await sleep(SESSION_START_RETRY_DELAY_MS * attempt);
    }
    throw lastError ?? new Error("Failed to create session");
}
export async function endSession(sessionId, headers) {
    const url = getBaseUrl();
    await fetch(`${url}/v1/sessions/${sessionId}/end`, {
        method: "POST",
        headers,
        body: JSON.stringify({}),
    });
}
// =============================================================================
// Navigation Helper
// =============================================================================
export async function navigateSession(sessionId, targetUrl, headers) {
    const url = getBaseUrl();
    return fetch(`${url}/v1/sessions/${sessionId}/navigate`, {
        method: "POST",
        headers,
        body: JSON.stringify({ url: targetUrl, frameId: "" }),
    });
}
/**
 * Gets the main frame ID from a CDP session
 */
export async function getMainFrameId(cdpUrl) {
    const browser = await chromium.connectOverCDP(cdpUrl);
    try {
        const contexts = browser.contexts();
        if (contexts.length === 0) {
            throw new Error("No browser contexts found");
        }
        const pages = contexts[0].pages();
        if (pages.length === 0) {
            throw new Error("No pages found");
        }
        const page = pages[0];
        // Use CDP to get the frame tree and extract the main frame ID
        const cdpSession = await page.context().newCDPSession(page);
        const { frameTree } = await cdpSession.send("Page.getFrameTree");
        await cdpSession.detach();
        return frameTree.frame.id;
    }
    finally {
        await browser.close();
    }
}
export async function readSSEStream(response) {
    const reader = response.body?.getReader();
    if (!reader) {
        throw new Error("No response body reader available");
    }
    const decoder = new TextDecoder();
    let fullResponse = "";
    for (;;) {
        const result = await reader.read();
        if (result.done)
            break;
        fullResponse += decoder.decode(result.value, { stream: true });
    }
    // Parse SSE events
    const events = [];
    const rawEvents = fullResponse.split("\n\n").filter((e) => e.trim());
    for (const rawEvent of rawEvents) {
        const event = {};
        const lines = rawEvent.split("\n");
        for (const line of lines) {
            if (line.startsWith("event:")) {
                event.event = line.slice(6).trim();
            }
            else if (line.startsWith("data:")) {
                event.data = line.slice(5).trim();
                try {
                    event.parsed = JSON.parse(event.data);
                }
                catch {
                    // Keep as string if not valid JSON
                }
            }
        }
        if (event.data || event.event) {
            events.push(event);
        }
    }
    return events;
}
/**
 * Read SSE stream from response and return raw string
 */
export async function readSSEStreamRaw(response) {
    const reader = response.body?.getReader();
    if (!reader)
        throw new Error("No response body reader");
    const decoder = new TextDecoder();
    let fullResponse = "";
    for (;;) {
        const result = await reader.read();
        if (result.done)
            break;
        fullResponse += decoder.decode(result.value, { stream: true });
    }
    return fullResponse;
}
/**
 * Parse raw SSE response string into typed events
 */
export function parseTypedSSEEvents(rawResponse) {
    const events = rawResponse.split("\n\n").filter((e) => e.trim());
    return events
        .map((event) => {
        const dataMatch = event.match(/data: (.+)/);
        if (dataMatch?.[1]) {
            return JSON.parse(dataMatch[1]);
        }
        return null;
    })
        .filter((e) => e !== null);
}
/**
 * Read SSE stream and parse into typed events (legacy - no debug context)
 */
export async function readTypedSSEStream(response) {
    const raw = await readSSEStreamRaw(response);
    return parseTypedSSEEvents(raw);
}
/**
 * Read SSE stream with full context for debugging test failures.
 * Use this instead of readTypedSSEStream when you need better error messages.
 */
export async function readTypedSSEStreamWithContext(response) {
    const status = response.status;
    const statusText = response.statusText;
    const raw = await readSSEStreamRaw(response);
    const events = parseTypedSSEEvents(raw);
    return {
        status,
        statusText,
        raw,
        events,
        debugSummary() {
            const eventStatuses = events.map((e) => e.data.status).join(" → ");
            const errorEvents = events.filter((e) => e.data.status === "error");
            const errorMessages = errorEvents
                .map((e) => e.data.error ?? "unknown error")
                .join(", ");
            let summary = `HTTP ${status} ${statusText}`;
            if (events.length === 0) {
                summary += `\n  No SSE events received`;
                summary += `\n  Raw response: ${raw.slice(0, 500)}${raw.length > 500 ? "..." : ""}`;
            }
            else {
                summary += `\n  Events (${events.length}): ${eventStatuses}`;
                if (errorMessages) {
                    summary += `\n  Errors: ${errorMessages}`;
                }
            }
            return summary;
        },
    };
}
/**
 * Assert with debug context - includes SSE stream info on failure
 */
export function assertWithContext(condition, message, context) {
    if (!condition) {
        throw new Error(`${message}\n\nDebug context:\n${context.debugSummary()}`);
    }
}
/**
 * Assert SSE event exists with debug context on failure, returns the found event
 */
export function assertEventExists(events, status, context) {
    const found = events.find((e) => e.data.status === status);
    assertWithContext(found !== undefined, `Should have a "${status}" event`, context);
    return found;
}
/**
 * Assert HTTP status with debug context on failure
 */
export function assertHttpStatus(context, expectedStatus, message) {
    assertWithContext(context.status === expectedStatus, message ?? `Expected HTTP ${expectedStatus}, got ${context.status}`, context);
}
/**
 * Fetch with full context for debugging test failures.
 * Captures timing, status, and response body.
 */
export async function fetchWithContext(url, options) {
    const startTime = Date.now();
    let response;
    try {
        response = await fetch(url, options);
    }
    catch (err) {
        const durationMs = Date.now() - startTime;
        const errorMsg = err instanceof Error ? err.message : String(err);
        return {
            status: 0,
            statusText: "FETCH_ERROR",
            body: null,
            raw: errorMsg,
            durationMs,
            headers: new Headers(),
            debugSummary() {
                return `Fetch failed after ${durationMs}ms: ${errorMsg}`;
            },
        };
    }
    const durationMs = Date.now() - startTime;
    const status = response.status;
    const statusText = response.statusText;
    const headers = response.headers;
    const raw = await response.text();
    let body = null;
    try {
        body = JSON.parse(raw);
    }
    catch {
        // Keep body as null if not valid JSON
    }
    return {
        status,
        statusText,
        body,
        raw,
        durationMs,
        headers,
        debugSummary() {
            const seconds = (durationMs / 1000).toFixed(1);
            let summary = `HTTP ${status} ${statusText} (${seconds}s)`;
            if (body && typeof body === "object") {
                const b = body;
                if (b.success === false && typeof b.message === "string") {
                    summary += `\n  Error: ${b.message}`;
                }
                if (typeof b.error === "string") {
                    summary += `\n  Error: ${b.error}`;
                }
            }
            // Show raw response if it's an error or unexpected
            if (status >= 400 || !body) {
                const truncated = raw.slice(0, 500);
                summary += `\n  Response: ${truncated}${raw.length > 500 ? "..." : ""}`;
            }
            return summary;
        },
    };
}
/**
 * Assert with fetch context - includes response info on failure
 */
export function assertFetchOk(condition, message, context) {
    if (!condition) {
        throw new Error(`${message}\n\nDebug context:\n${context.debugSummary()}`);
    }
}
/**
 * Assert fetch succeeded with expected status
 */
export function assertFetchStatus(context, expectedStatus, message) {
    assertFetchOk(context.status === expectedStatus, message ?? `Expected HTTP ${expectedStatus}, got ${context.status}`, context);
}
// =============================================================================
// Test Context Manager
// =============================================================================
export class TestSession {
    sessionId = null;
    headers;
    constructor(headers) {
        this.headers = headers;
    }
    async start() {
        this.sessionId = await createSession(this.headers);
        return this.sessionId;
    }
    async navigate(targetUrl) {
        if (!this.sessionId) {
            throw new Error("Session not started");
        }
        return navigateSession(this.sessionId, targetUrl, this.headers);
    }
    async end() {
        if (this.sessionId) {
            try {
                await endSession(this.sessionId, this.headers);
            }
            catch {
                // Ignore errors when ending session
            }
            this.sessionId = null;
        }
    }
    getSessionId() {
        if (!this.sessionId) {
            throw new Error("Session not started");
        }
        return this.sessionId;
    }
}
