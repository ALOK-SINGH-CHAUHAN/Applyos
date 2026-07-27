import { endBrowserbaseSession } from "../../browserbaseCleanup.js";
import { initV3 } from "../../initV3.js";
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
    "representation",
];
class UnderstudyLocatorHandle {
    locatorHandle;
    constructor(locatorHandle) {
        this.locatorHandle = locatorHandle;
    }
    async count() {
        return this.locatorHandle.count();
    }
    async click() {
        await this.locatorHandle.click();
    }
    async hover() {
        await this.locatorHandle.hover();
    }
    async fill(value) {
        await this.locatorHandle.fill(value);
    }
    async type(text, opts) {
        await this.locatorHandle.type(text, opts);
    }
    async isVisible() {
        return this.locatorHandle.isVisible();
    }
    async textContent() {
        return this.locatorHandle.textContent();
    }
    async inputValue() {
        return this.locatorHandle.inputValue();
    }
}
class UnderstudyPageHandle {
    page;
    id;
    constructor(page) {
        this.page = page;
        this.id = this.page.targetId();
    }
    async goto(url, opts) {
        await this.page.goto(url, opts);
    }
    async reload(opts) {
        await this.page.reload(opts);
    }
    async back(opts) {
        return (await this.page.goBack(opts)) !== null;
    }
    async goBack(opts) {
        return this.back(opts);
    }
    async forward(opts) {
        return (await this.page.goForward(opts)) !== null;
    }
    async goForward(opts) {
        return this.forward(opts);
    }
    url() {
        return this.page.url();
    }
    async title() {
        return this.page.title();
    }
    async evaluate(pageFunctionOrExpression, arg) {
        return this.page.mainFrame().evaluate(pageFunctionOrExpression, arg);
    }
    async screenshot(opts) {
        return this.page.screenshot(opts);
    }
    async setViewport(size) {
        await this.page.setViewportSize(size.width, size.height);
    }
    async setViewportSize(width, height) {
        await this.page.setViewportSize(width, height);
    }
    async wait(spec) {
        switch (spec.kind) {
            case "selector":
                await this.page.waitForSelector(spec.selector, {
                    timeout: spec.timeoutMs,
                    state: spec.state,
                });
                return;
            case "timeout":
                await this.page.waitForTimeout(spec.timeoutMs);
                return;
            case "load_state":
                await this.page.waitForLoadState(spec.state, spec.timeoutMs);
                return;
            default: {
                const exhaustive = spec;
                throw new Error(`Unsupported wait spec: ${JSON.stringify(exhaustive)}`);
            }
        }
    }
    async waitForSelector(selector, opts) {
        return this.page.waitForSelector(selector, opts);
    }
    async waitForTimeout(ms) {
        await this.page.waitForTimeout(ms);
    }
    locator(selector) {
        return new UnderstudyLocatorHandle(this.page.locator(selector));
    }
    async click(targetOrX, y) {
        if (typeof targetOrX === "number") {
            if (typeof y !== "number") {
                throw new Error("click(x, y) requires both numeric coordinates");
            }
            await this.page.click(targetOrX, y);
            return;
        }
        const target = typeof targetOrX === "string"
            ? { kind: "selector", value: targetOrX }
            : targetOrX;
        switch (target.kind) {
            case "selector":
                await this.page.locator(target.value).click();
                return;
            case "coords":
                await this.page.click(target.x, target.y);
                return;
            default:
                throw new Error(`understudy_code does not support click target kind "${target.kind}" yet`);
        }
    }
    async hover(targetOrX, y) {
        if (typeof targetOrX === "number") {
            if (typeof y !== "number") {
                throw new Error("hover(x, y) requires both numeric coordinates");
            }
            await this.page.hover(targetOrX, y);
            return;
        }
        const target = typeof targetOrX === "string"
            ? { kind: "selector", value: targetOrX }
            : targetOrX;
        switch (target.kind) {
            case "selector":
                await this.page.locator(target.value).hover();
                return;
            case "coords":
                await this.page.hover(target.x, target.y);
                return;
            default:
                throw new Error(`understudy_code does not support hover target kind "${target.kind}" yet`);
        }
    }
    async scroll(x, y, deltaX, deltaY) {
        await this.page.scroll(x, y, deltaX, deltaY);
    }
    async type(targetOrText, text) {
        if (typeof targetOrText === "string" && typeof text === "undefined") {
            await this.page.type(targetOrText);
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
                await this.page.type(text);
                return;
            case "selector":
                await this.page.locator(target.value).type(text);
                return;
            case "coords":
                await this.page.click(target.x, target.y);
                await this.page.type(text);
                return;
            default:
                throw new Error(`understudy_code does not support type target kind "${target.kind}" yet`);
        }
    }
    async press(targetOrKey, key) {
        if (typeof targetOrKey === "string" && typeof key === "undefined") {
            await this.page.keyPress(targetOrKey);
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
                await this.page.keyPress(key);
                return;
            case "selector":
                await this.page.locator(target.value).click();
                await this.page.keyPress(key);
                return;
            case "coords":
                await this.page.click(target.x, target.y);
                await this.page.keyPress(key);
                return;
            default:
                throw new Error(`understudy_code does not support press target kind "${target.kind}" yet`);
        }
    }
    async represent(opts) {
        const snapshot = await this.page.snapshot({
            includeIframes: opts?.includeIframes,
        });
        const content = snapshot.formattedTree;
        return {
            kind: "snapshot_refs",
            content,
            metadata: {
                bytes: Buffer.byteLength(content, "utf8"),
                tokenEstimate: Math.ceil(content.length / 4),
                refCount: Object.keys(snapshot.xpathMap ?? {}).length,
            },
            raw: snapshot,
        };
    }
}
class UnderstudySession {
    v3Result;
    handles = new Map();
    closed = false;
    constructor(v3Result) {
        this.v3Result = v3Result;
    }
    wrap(page) {
        const id = page.targetId();
        const existing = this.handles.get(id);
        if (existing)
            return existing;
        const handle = new UnderstudyPageHandle(page);
        this.handles.set(id, handle);
        return handle;
    }
    async listPages() {
        return this.v3Result.v3.context.pages().map((page) => this.wrap(page));
    }
    async activePage() {
        const page = this.v3Result.v3.context.activePage();
        if (page)
            return this.wrap(page);
        const pages = this.v3Result.v3.context.pages();
        if (pages.length === 0) {
            throw new Error("No active page available");
        }
        return this.wrap(pages[0]);
    }
    async newPage(url) {
        return this.wrap(await this.v3Result.v3.context.newPage(url));
    }
    async selectPage(pageId) {
        const page = this.v3Result.v3.context
            .pages()
            .find((candidate) => candidate.targetId() === pageId);
        if (!page) {
            throw new Error(`Unknown page id "${pageId}"`);
        }
        this.v3Result.v3.context.setActivePage(page);
    }
    async closePage(pageId) {
        const page = this.v3Result.v3.context
            .pages()
            .find((candidate) => candidate.targetId() === pageId);
        if (!page) {
            throw new Error(`Unknown page id "${pageId}"`);
        }
        await page.close();
        this.handles.delete(pageId);
    }
    async close() {
        if (this.closed)
            return;
        this.closed = true;
        try {
            await this.v3Result.v3.close();
        }
        catch {
            // best-effort
        }
        await endBrowserbaseSession(this.v3Result.v3);
    }
    async getArtifacts() {
        return [];
    }
    async getRawMetrics() {
        return {
            browserbaseSessionId: this.v3Result.v3.browserbaseSessionID,
            browserbaseSessionUrl: this.v3Result.v3.browserbaseSessionURL,
        };
    }
}
function connectionModeFromProfile(startupProfile, endpointKind) {
    if (startupProfile === "tool_launch_local") {
        return "launch";
    }
    if (startupProfile === "tool_create_browserbase") {
        return "browserbase_native";
    }
    if (startupProfile === "runner_provided_local_cdp" ||
        startupProfile === "runner_provided_browserbase_cdp" ||
        startupProfile === "tool_attach_local_cdp" ||
        startupProfile === "tool_attach_browserbase") {
        return endpointKind === "http" ? "attach_http" : "attach_ws";
    }
    return "launch";
}
export class UnderstudyCodeTool {
    id = "understudy_code";
    surface = "code";
    family = "understudy";
    supportedStartupProfiles = [
        "runner_provided_local_cdp",
        "runner_provided_browserbase_cdp",
        "tool_launch_local",
        "tool_create_browserbase",
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
        if (input.startupProfile === "tool_attach_local_cdp") {
            throw new Error(`understudy_code does not support startup profile "${input.startupProfile}" yet`);
        }
        const v3Result = await initV3({
            logger: input.logger,
            modelName: "openai/gpt-4.1-mini",
            configOverrides: {
                env: input.startupProfile.startsWith("runner_provided") ||
                    input.startupProfile === "tool_attach_browserbase"
                    ? "LOCAL"
                    : input.environment,
                localBrowserLaunchOptions: {
                    headless: true,
                    ...(process.env.CHROME_PATH
                        ? { executablePath: process.env.CHROME_PATH }
                        : {}),
                    ...(input.providedEndpoint
                        ? {
                            cdpUrl: input.providedEndpoint.url,
                            cdpHeaders: input.providedEndpoint.headers,
                        }
                        : {}),
                },
                ...(input.startupProfile === "tool_attach_browserbase" &&
                    input.browserbase?.sessionId
                    ? { browserbaseSessionID: input.browserbase.sessionId }
                    : {}),
                ...(input.startupProfile === "tool_create_browserbase" &&
                    input.browserbase?.sessionParams
                    ? {
                        browserbaseSessionCreateParams: input.browserbase
                            .sessionParams,
                    }
                    : {}),
            },
        });
        const session = new UnderstudySession(v3Result);
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
                connectionMode: connectionModeFromProfile(input.startupProfile, input.providedEndpoint?.kind),
                startupProfile: input.startupProfile,
            },
        };
    }
}
