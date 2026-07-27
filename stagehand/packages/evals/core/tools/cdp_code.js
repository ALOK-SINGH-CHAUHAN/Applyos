import { loadWsModule } from "../runtime/coreDeps.js";
const DEFAULT_TIMEOUT_MS = 15_000;
const POLL_INTERVAL_MS = 100;
const SUPPORTED_CAPABILITIES = [
    "session",
    "navigation",
    "evaluation",
    "screenshot",
    "viewport",
    "wait",
    "click",
    "hover",
    "scroll",
    "type",
    "press",
    "tabs",
];
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function serializeEvaluationArg(arg) {
    return typeof arg === "undefined" ? "undefined" : JSON.stringify(arg);
}
export function buildCdpEvaluationExpression(pageFunctionOrExpression, arg) {
    if (typeof pageFunctionOrExpression === "string") {
        return pageFunctionOrExpression;
    }
    return `(() => {
            const __name = (target) => target;
            return (${pageFunctionOrExpression.toString()})(${serializeEvaluationArg(arg)});
          })()`;
}
function isPrintableKey(key) {
    return key.length === 1;
}
function keyEventPayload(key) {
    const specialKeys = {
        Enter: { key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 },
        Tab: { key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 },
        Escape: { key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 },
        Backspace: {
            key: "Backspace",
            code: "Backspace",
            windowsVirtualKeyCode: 8,
        },
        Space: { key: " ", code: "Space", windowsVirtualKeyCode: 32 },
        ArrowUp: { key: "ArrowUp", code: "ArrowUp", windowsVirtualKeyCode: 38 },
        ArrowDown: {
            key: "ArrowDown",
            code: "ArrowDown",
            windowsVirtualKeyCode: 40,
        },
        ArrowLeft: {
            key: "ArrowLeft",
            code: "ArrowLeft",
            windowsVirtualKeyCode: 37,
        },
        ArrowRight: {
            key: "ArrowRight",
            code: "ArrowRight",
            windowsVirtualKeyCode: 39,
        },
    };
    const special = specialKeys[key];
    if (special)
        return special;
    const normalized = key.toUpperCase();
    return {
        key,
        code: /^[A-Z]$/.test(normalized) ? `Key${normalized}` : "",
        windowsVirtualKeyCode: normalized.charCodeAt(0),
    };
}
async function resolveWebSocketEndpoint(input) {
    if (input.kind === "ws") {
        return input.url;
    }
    const baseUrl = input.url.replace(/\/$/, "");
    const response = await fetch(`${baseUrl}/json/version`);
    if (!response.ok) {
        throw new Error(`Failed to resolve CDP websocket URL from ${baseUrl}: ${response.status} ${response.statusText}`);
    }
    const payload = (await response.json());
    if (!payload.webSocketDebuggerUrl) {
        throw new Error(`CDP endpoint ${baseUrl} did not return webSocketDebuggerUrl`);
    }
    return payload.webSocketDebuggerUrl;
}
export class CdpConnection {
    pending = new Map();
    eventListeners = new Set();
    ws;
    nextId = 0;
    closed = false;
    constructor(ws) {
        this.ws = ws;
        this.ws.on("message", (data) => {
            this.handleMessage(data);
        });
        this.ws.on("error", (error) => {
            const resolved = error instanceof Error ? error : new Error(String(error));
            this.rejectAll(resolved);
        });
        this.ws.on("close", () => {
            this.closed = true;
            this.rejectAll(new Error("CDP websocket closed"));
        });
    }
    static async connect(input) {
        const wsUrl = await resolveWebSocketEndpoint(input);
        const WebSocket = loadWsModule();
        const ws = await new Promise((resolve, reject) => {
            const socket = new WebSocket(wsUrl, input.headers ? { headers: input.headers } : {});
            socket.once("open", () => resolve(socket));
            socket.once("error", (error) => {
                reject(error instanceof Error ? error : new Error(String(error)));
            });
        });
        return new CdpConnection(ws);
    }
    onEvent(listener) {
        this.eventListeners.add(listener);
        return () => {
            this.eventListeners.delete(listener);
        };
    }
    async send(method, params, sessionId) {
        if (this.closed) {
            throw new Error("CDP websocket is already closed");
        }
        const id = ++this.nextId;
        const payload = {
            id,
            method,
            ...(params ? { params } : {}),
            ...(sessionId ? { sessionId } : {}),
        };
        const result = await new Promise((resolve, reject) => {
            this.pending.set(id, { resolve, reject });
            this.ws.send(JSON.stringify(payload), (error) => {
                if (!error)
                    return;
                this.pending.delete(id);
                reject(error);
            });
        });
        return result;
    }
    async close() {
        if (this.closed)
            return;
        this.closed = true;
        this.ws.close();
    }
    handleMessage(raw) {
        const data = typeof raw === "string"
            ? raw
            : Buffer.isBuffer(raw)
                ? raw.toString("utf8")
                : String(raw);
        const message = JSON.parse(data);
        if ("id" in message && typeof message.id === "number") {
            const pending = this.pending.get(message.id);
            if (!pending)
                return;
            this.pending.delete(message.id);
            const commandMessage = message;
            if (commandMessage.error) {
                pending.reject(new Error(commandMessage.error.message ?? "CDP command failed"));
                return;
            }
            pending.resolve(commandMessage.result);
            return;
        }
        const eventMessage = message;
        for (const listener of this.eventListeners) {
            listener(eventMessage);
        }
    }
    rejectAll(error) {
        for (const pending of this.pending.values()) {
            pending.reject(error);
        }
        this.pending.clear();
    }
}
class CdpLocatorHandle {
    page;
    selector;
    constructor(page, selector) {
        this.page = page;
        this.selector = selector;
    }
    async count() {
        return (await this.page.inspectSelector(this.selector)).count;
    }
    async click() {
        await this.page.click(this.selector);
    }
    async hover() {
        await this.page.hover(this.selector);
    }
    async fill(value) {
        await this.page.fillSelector(this.selector, value);
    }
    async type(text) {
        await this.page.type(this.selector, text);
    }
    async isVisible() {
        return (await this.page.inspectSelector(this.selector)).visible;
    }
    async textContent() {
        return (await this.page.inspectSelector(this.selector)).textContent;
    }
    async inputValue() {
        return (await this.page.inspectSelector(this.selector)).value;
    }
}
class CdpPageHandle {
    connection;
    state;
    constructor(connection, state) {
        this.connection = connection;
        this.state = state;
    }
    get id() {
        return this.state.targetId;
    }
    url() {
        return this.state.currentUrl;
    }
    async goto(url, opts) {
        await this.connection.send("Page.navigate", { url }, this.state.sessionId);
        await this.waitForReadyState(opts?.waitUntil ?? "load", opts?.timeoutMs);
        await this.refreshUrl();
    }
    async reload(opts) {
        await this.connection.send("Page.reload", {}, this.state.sessionId);
        await this.waitForReadyState(opts?.waitUntil ?? "load", opts?.timeoutMs);
        await this.refreshUrl();
    }
    async back(opts) {
        return this.navigateHistory(-1, opts);
    }
    async forward(opts) {
        return this.navigateHistory(1, opts);
    }
    async goBack(opts) {
        return this.back(opts);
    }
    async goForward(opts) {
        return this.forward(opts);
    }
    async title() {
        return this.evaluate(() => document.title);
    }
    async evaluate(pageFunctionOrExpression, arg) {
        const expression = buildCdpEvaluationExpression(pageFunctionOrExpression, arg);
        const response = (await this.connection.send("Runtime.evaluate", {
            expression,
            returnByValue: true,
            awaitPromise: true,
            userGesture: true,
        }, this.state.sessionId));
        if (response.exceptionDetails) {
            throw new Error(response.exceptionDetails.exception?.description ??
                response.exceptionDetails.text ??
                "CDP Runtime.evaluate failed");
        }
        return response.result?.value;
    }
    async screenshot(opts) {
        const response = (await this.connection.send("Page.captureScreenshot", {
            format: opts?.type ?? "png",
            ...(typeof opts?.quality === "number" ? { quality: opts.quality } : {}),
            ...(opts?.fullPage ? { captureBeyondViewport: true } : {}),
        }, this.state.sessionId));
        return Buffer.from(response.data, "base64");
    }
    async setViewport(size) {
        await this.setViewportSize(size.width, size.height);
    }
    async setViewportSize(width, height) {
        await this.connection.send("Emulation.setDeviceMetricsOverride", {
            width,
            height,
            deviceScaleFactor: 1,
            mobile: false,
        }, this.state.sessionId);
    }
    async wait(spec) {
        switch (spec.kind) {
            case "selector":
                await this.waitForSelector(spec.selector, {
                    timeout: spec.timeoutMs,
                    state: spec.state,
                });
                return;
            case "timeout":
                await this.waitForTimeout(spec.timeoutMs);
                return;
            case "load_state":
                await this.waitForReadyState(spec.state, spec.timeoutMs);
                return;
            default: {
                const exhaustive = spec;
                throw new Error(`Unsupported wait spec: ${JSON.stringify(exhaustive)}`);
            }
        }
    }
    async waitForSelector(selector, opts) {
        const timeoutMs = opts?.timeout ?? DEFAULT_TIMEOUT_MS;
        const deadline = Date.now() + timeoutMs;
        const expectedState = opts?.state ?? "attached";
        while (Date.now() < deadline) {
            const inspection = await this.inspectSelector(selector);
            const attached = inspection.count > 0;
            const hidden = !inspection.visible;
            if ((expectedState === "attached" && attached) ||
                (expectedState === "visible" && inspection.visible) ||
                (expectedState === "detached" && !attached) ||
                (expectedState === "hidden" && attached && hidden)) {
                return true;
            }
            await sleep(POLL_INTERVAL_MS);
        }
        throw new Error(`Timed out waiting for selector "${selector}" to be ${expectedState}`);
    }
    async waitForTimeout(ms) {
        await sleep(ms);
    }
    locator(selector) {
        return new CdpLocatorHandle(this, selector);
    }
    async click(targetOrX, y) {
        if (typeof targetOrX === "number") {
            if (typeof y !== "number") {
                throw new Error("click(x, y) requires both numeric coordinates");
            }
            await this.dispatchMouseClick(targetOrX, y);
            return;
        }
        const target = typeof targetOrX === "string"
            ? { kind: "selector", value: targetOrX }
            : targetOrX;
        switch (target.kind) {
            case "selector": {
                const center = await this.centerForSelector(target.value);
                await this.dispatchMouseClick(center.x, center.y);
                return;
            }
            case "coords":
                await this.dispatchMouseClick(target.x, target.y);
                return;
            default:
                throw new Error(`cdp_code does not support click target kind "${target.kind}" yet`);
        }
    }
    async hover(targetOrX, y) {
        if (typeof targetOrX === "number") {
            if (typeof y !== "number") {
                throw new Error("hover(x, y) requires both numeric coordinates");
            }
            await this.dispatchMouseMove(targetOrX, y);
            return;
        }
        const target = typeof targetOrX === "string"
            ? { kind: "selector", value: targetOrX }
            : targetOrX;
        switch (target.kind) {
            case "selector": {
                const center = await this.centerForSelector(target.value);
                await this.dispatchMouseMove(center.x, center.y);
                return;
            }
            case "coords":
                await this.dispatchMouseMove(target.x, target.y);
                return;
            default:
                throw new Error(`cdp_code does not support hover target kind "${target.kind}" yet`);
        }
    }
    async scroll(x, y, deltaX, deltaY) {
        await this.dispatchMouseMove(x, y);
        await this.connection.send("Input.dispatchMouseEvent", {
            type: "mouseWheel",
            x,
            y,
            deltaX,
            deltaY,
        }, this.state.sessionId);
    }
    async type(targetOrText, text) {
        if (typeof targetOrText === "string" && typeof text === "undefined") {
            await this.insertText(targetOrText);
            return;
        }
        if (typeof text !== "string") {
            throw new Error("type(target, text) requires text");
        }
        const target = typeof targetOrText === "string"
            ? { kind: "selector", value: targetOrText }
            : targetOrText;
        switch (target.kind) {
            case "focused":
                await this.insertText(text);
                return;
            case "selector":
                await this.focusSelector(target.value);
                await this.insertText(text);
                return;
            case "coords":
                await this.dispatchMouseClick(target.x, target.y);
                await this.insertText(text);
                return;
            default:
                throw new Error(`cdp_code does not support type target kind "${target.kind}" yet`);
        }
    }
    async press(targetOrKey, key) {
        if (typeof targetOrKey === "string" && typeof key === "undefined") {
            await this.dispatchKey(targetOrKey);
            return;
        }
        if (typeof key !== "string") {
            throw new Error("press(target, key) requires key");
        }
        const target = typeof targetOrKey === "string"
            ? { kind: "selector", value: targetOrKey }
            : targetOrKey;
        switch (target.kind) {
            case "focused":
                await this.dispatchKey(key);
                return;
            case "selector":
                await this.focusSelector(target.value);
                await this.dispatchKey(key);
                return;
            case "coords":
                await this.dispatchMouseClick(target.x, target.y);
                await this.dispatchKey(key);
                return;
            default:
                throw new Error(`cdp_code does not support press target kind "${target.kind}" yet`);
        }
    }
    async inspectSelector(selector) {
        return this.evaluate((rawSelector) => {
            function queryAll(selectorInput) {
                if (selectorInput.startsWith("xpath=")) {
                    const expression = selectorInput.slice("xpath=".length);
                    const result = document.evaluate(expression, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                    const nodes = [];
                    for (let index = 0; index < result.snapshotLength; index += 1) {
                        const node = result.snapshotItem(index);
                        if (node instanceof Element) {
                            nodes.push(node);
                        }
                    }
                    return nodes;
                }
                return Array.from(document.querySelectorAll(selectorInput));
            }
            const matches = queryAll(rawSelector);
            const first = matches[0];
            if (!first) {
                return {
                    count: 0,
                    visible: false,
                    textContent: null,
                    value: "",
                    center: null,
                };
            }
            const rect = first.getBoundingClientRect();
            const style = window.getComputedStyle(first);
            const visible = (rect.width > 0 ||
                rect.height > 0 ||
                first.getClientRects().length > 0) &&
                style.visibility !== "hidden" &&
                style.display !== "none";
            const inputLike = first;
            return {
                count: matches.length,
                visible,
                textContent: first.textContent,
                value: typeof inputLike.value === "string" ? inputLike.value : "",
                center: {
                    x: rect.left + rect.width / 2,
                    y: rect.top + rect.height / 2,
                },
            };
        }, selector);
    }
    async fillSelector(selector, value) {
        const filled = await this.evaluate(({ rawSelector, nextValue, }) => {
            function queryOne(selectorInput) {
                if (selectorInput.startsWith("xpath=")) {
                    const expression = selectorInput.slice("xpath=".length);
                    const result = document.evaluate(expression, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                    return result.singleNodeValue instanceof HTMLElement
                        ? result.singleNodeValue
                        : null;
                }
                return document.querySelector(selectorInput);
            }
            const element = queryOne(rawSelector);
            if (!element)
                return false;
            const inputLike = element;
            element.focus();
            inputLike.value = nextValue;
            element.dispatchEvent(new Event("input", { bubbles: true }));
            element.dispatchEvent(new Event("change", { bubbles: true }));
            return true;
        }, { rawSelector: selector, nextValue: value });
        if (!filled) {
            throw new Error(`Unable to fill selector "${selector}"`);
        }
    }
    async navigateHistory(delta, opts) {
        const history = (await this.connection.send("Page.getNavigationHistory", {}, this.state.sessionId));
        const nextEntry = history.entries[history.currentIndex + delta];
        if (!nextEntry)
            return false;
        await this.connection.send("Page.navigateToHistoryEntry", { entryId: nextEntry.id }, this.state.sessionId);
        await this.waitForReadyState(opts?.waitUntil ?? "load", opts?.timeoutMs);
        await this.refreshUrl();
        return true;
    }
    async waitForReadyState(waitUntil, timeoutMs = DEFAULT_TIMEOUT_MS) {
        const deadline = Date.now() + timeoutMs;
        while (Date.now() < deadline) {
            try {
                const readyState = await this.evaluate(() => document.readyState);
                if (waitUntil === "domcontentloaded") {
                    if (readyState === "interactive" || readyState === "complete") {
                        return;
                    }
                }
                else if (readyState === "complete") {
                    return;
                }
            }
            catch {
                // retry while navigation settles
            }
            await sleep(POLL_INTERVAL_MS);
        }
        throw new Error(`Timed out waiting for document readyState ${waitUntil}`);
    }
    async refreshUrl() {
        try {
            this.state.currentUrl = await this.evaluate(() => window.location.href);
        }
        catch {
            // best-effort only
        }
    }
    async focusSelector(selector) {
        const focused = await this.evaluate((rawSelector) => {
            function queryOne(selectorInput) {
                if (selectorInput.startsWith("xpath=")) {
                    const expression = selectorInput.slice("xpath=".length);
                    const result = document.evaluate(expression, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                    return result.singleNodeValue instanceof HTMLElement
                        ? result.singleNodeValue
                        : null;
                }
                return document.querySelector(selectorInput);
            }
            const element = queryOne(rawSelector);
            if (!element)
                return false;
            element.scrollIntoView({ block: "center", inline: "center" });
            element.focus();
            return true;
        }, selector);
        if (!focused) {
            throw new Error(`Unable to focus selector "${selector}"`);
        }
    }
    async centerForSelector(selector) {
        const inspection = await this.inspectSelector(selector);
        if (!inspection.center) {
            throw new Error(`Unable to resolve selector "${selector}"`);
        }
        return inspection.center;
    }
    async dispatchMouseMove(x, y) {
        await this.connection.send("Input.dispatchMouseEvent", {
            type: "mouseMoved",
            x,
            y,
            button: "none",
        }, this.state.sessionId);
    }
    async dispatchMouseClick(x, y) {
        await this.dispatchMouseMove(x, y);
        await this.connection.send("Input.dispatchMouseEvent", {
            type: "mousePressed",
            x,
            y,
            button: "left",
            clickCount: 1,
        }, this.state.sessionId);
        await this.connection.send("Input.dispatchMouseEvent", {
            type: "mouseReleased",
            x,
            y,
            button: "left",
            clickCount: 1,
        }, this.state.sessionId);
    }
    async insertText(text) {
        await this.connection.send("Input.insertText", { text }, this.state.sessionId);
    }
    async dispatchKey(key) {
        if (isPrintableKey(key)) {
            const payload = keyEventPayload(key);
            await this.connection.send("Input.dispatchKeyEvent", {
                type: "keyDown",
                text: key,
                unmodifiedText: key,
                ...payload,
            }, this.state.sessionId);
            await this.connection.send("Input.dispatchKeyEvent", {
                type: "keyUp",
                ...payload,
            }, this.state.sessionId);
            return;
        }
        const payload = keyEventPayload(key);
        await this.connection.send("Input.dispatchKeyEvent", {
            type: "rawKeyDown",
            ...payload,
        }, this.state.sessionId);
        await this.connection.send("Input.dispatchKeyEvent", {
            type: "keyUp",
            ...payload,
        }, this.state.sessionId);
    }
}
class CdpSession {
    connection;
    pages = new Map();
    activePageId = null;
    closed = false;
    constructor(connection) {
        this.connection = connection;
    }
    static async connect(input) {
        const connection = await CdpConnection.connect(input.providedEndpoint);
        const session = new CdpSession(connection);
        await session.bootstrap();
        return session;
    }
    async listPages() {
        return [...this.pages.values()].map((state) => new CdpPageHandle(this.connection, state));
    }
    async activePage() {
        if (this.activePageId) {
            const state = this.pages.get(this.activePageId);
            if (state)
                return new CdpPageHandle(this.connection, state);
        }
        const first = this.pages.values().next().value;
        if (!first) {
            throw new Error("No active page available");
        }
        this.activePageId = first.targetId;
        return new CdpPageHandle(this.connection, first);
    }
    async newPage(url) {
        const response = (await this.connection.send("Target.createTarget", {
            url: "about:blank",
        }));
        const state = await this.attachPage(response.targetId);
        this.activePageId = state.targetId;
        const page = new CdpPageHandle(this.connection, state);
        if (url) {
            await page.goto(url);
        }
        return page;
    }
    async selectPage(pageId) {
        const state = this.pages.get(pageId);
        if (!state) {
            throw new Error(`Unknown page id "${pageId}"`);
        }
        await this.connection.send("Page.bringToFront", {}, state.sessionId);
        this.activePageId = pageId;
    }
    async closePage(pageId) {
        const state = this.pages.get(pageId);
        if (!state) {
            throw new Error(`Unknown page id "${pageId}"`);
        }
        await this.connection.send("Target.closeTarget", {
            targetId: state.targetId,
        });
        this.pages.delete(pageId);
        if (this.activePageId === pageId) {
            this.activePageId = this.pages.keys().next().value ?? null;
        }
    }
    async close() {
        if (this.closed)
            return;
        this.closed = true;
        await this.connection.close();
    }
    async getArtifacts() {
        return [];
    }
    async getRawMetrics() {
        return {
            pageCount: this.pages.size,
        };
    }
    async bootstrap() {
        const targetInfos = await this.listPageTargets();
        if (targetInfos.length === 0) {
            const created = (await this.connection.send("Target.createTarget", {
                url: "about:blank",
            }));
            await this.attachPage(created.targetId);
        }
        else {
            for (const targetInfo of targetInfos) {
                await this.attachPage(targetInfo.targetId, targetInfo.url);
            }
        }
        const firstPage = this.pages.keys().next().value;
        this.activePageId = firstPage ?? null;
    }
    async listPageTargets() {
        const response = (await this.connection.send("Target.getTargets"));
        return response.targetInfos
            .filter((targetInfo) => targetInfo.type === "page" &&
            !targetInfo.url?.startsWith("devtools://"))
            .map((targetInfo) => ({
            targetId: targetInfo.targetId,
            url: targetInfo.url ?? "about:blank",
        }));
    }
    async attachPage(targetId, initialUrl = "about:blank") {
        if (this.pages.has(targetId)) {
            return this.pages.get(targetId);
        }
        const response = (await this.connection.send("Target.attachToTarget", {
            targetId,
            flatten: true,
        }));
        await this.connection.send("Page.enable", {}, response.sessionId);
        await this.connection.send("Runtime.enable", {}, response.sessionId);
        await this.connection.send("Page.setLifecycleEventsEnabled", { enabled: true }, response.sessionId);
        const state = {
            targetId,
            sessionId: response.sessionId,
            currentUrl: initialUrl,
        };
        const page = new CdpPageHandle(this.connection, state);
        await page.waitForTimeout(50);
        await page.refreshUrl();
        this.pages.set(targetId, state);
        return state;
    }
}
function connectionModeFromProfile(startupProfile, endpointKind) {
    if (startupProfile === "runner_provided_local_cdp" ||
        startupProfile === "runner_provided_browserbase_cdp" ||
        startupProfile === "tool_attach_local_cdp" ||
        startupProfile === "tool_attach_browserbase") {
        return endpointKind === "http" ? "attach_http" : "attach_ws";
    }
    return "launch";
}
export class CdpCodeTool {
    id = "cdp_code";
    surface = "code";
    family = "cdp";
    supportedStartupProfiles = [
        "runner_provided_local_cdp",
        "runner_provided_browserbase_cdp",
        "tool_attach_local_cdp",
        "tool_attach_browserbase",
    ];
    supportedCapabilities = [
        ...SUPPORTED_CAPABILITIES,
    ];
    supportedTargetKinds = [
        "selector",
        "coords",
        "focused",
    ];
    async start(input) {
        if (!input.providedEndpoint) {
            throw new Error(`cdp_code startup profile "${input.startupProfile}" requires a providedEndpoint`);
        }
        const session = await CdpSession.connect({
            providedEndpoint: input.providedEndpoint,
        });
        return {
            session,
            cleanup: async () => {
                await session.close();
            },
            metadata: {
                environment: input.environment === "BROWSERBASE" ? "browserbase" : "local",
                browserOwnership: input.startupProfile.startsWith("runner_provided")
                    ? "runner"
                    : "tool",
                connectionMode: connectionModeFromProfile(input.startupProfile, input.providedEndpoint.kind),
                startupProfile: input.startupProfile,
            },
        };
    }
}
