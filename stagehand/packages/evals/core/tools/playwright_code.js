import { chromium, } from "playwright";
import { resolveLocalChromeExecutablePath } from "../targets/localChrome.js";
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
function countAccessibilityNodes(node) {
    if (!node || typeof node !== "object")
        return 0;
    const children = "children" in node && Array.isArray(node.children) ? node.children : [];
    return (1 + children.reduce((sum, child) => sum + countAccessibilityNodes(child), 0));
}
class PlaywrightLocatorHandle {
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
class PlaywrightPageHandle {
    page;
    id;
    constructor(page, id) {
        this.page = page;
        this.id = id;
    }
    async goto(url, opts) {
        await this.page.goto(url, {
            waitUntil: opts?.waitUntil,
            timeout: opts?.timeoutMs,
        });
    }
    async reload(opts) {
        await this.page.reload({
            waitUntil: opts?.waitUntil,
            timeout: opts?.timeoutMs,
        });
    }
    async back(opts) {
        return ((await this.page.goBack({
            waitUntil: opts?.waitUntil,
            timeout: opts?.timeoutMs,
        })) !== null);
    }
    async goBack(opts) {
        return this.back(opts);
    }
    async forward(opts) {
        return ((await this.page.goForward({
            waitUntil: opts?.waitUntil,
            timeout: opts?.timeoutMs,
        })) !== null);
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
        return this.page.evaluate(pageFunctionOrExpression, arg);
    }
    async screenshot(opts) {
        return this.page.screenshot(opts);
    }
    async setViewport(size) {
        await this.page.setViewportSize(size);
    }
    async setViewportSize(width, height) {
        await this.page.setViewportSize({ width, height });
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
                await this.page.waitForLoadState(spec.state, {
                    timeout: spec.timeoutMs,
                });
                return;
            default: {
                const exhaustive = spec;
                throw new Error(`Unsupported wait spec: ${JSON.stringify(exhaustive)}`);
            }
        }
    }
    async waitForSelector(selector, opts) {
        await this.page.waitForSelector(selector, opts);
        return true;
    }
    async waitForTimeout(ms) {
        await this.page.waitForTimeout(ms);
    }
    locator(selector) {
        return new PlaywrightLocatorHandle(this.page.locator(selector));
    }
    roleTarget(target) {
        return this.page.getByRole(target.role, {
            name: target.name,
        });
    }
    textTarget(target) {
        return this.page.getByText(target.text);
    }
    async click(targetOrX, y) {
        if (typeof targetOrX === "number") {
            if (typeof y !== "number") {
                throw new Error("click(x, y) requires both numeric coordinates");
            }
            await this.page.mouse.click(targetOrX, y);
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
                await this.page.mouse.click(target.x, target.y);
                return;
            case "role_name":
                await this.roleTarget(target).click();
                return;
            case "text":
                await this.textTarget(target).click();
                return;
            default:
                throw new Error(`playwright_code does not support click target kind "${target.kind}" yet`);
        }
    }
    async hover(targetOrX, y) {
        if (typeof targetOrX === "number") {
            if (typeof y !== "number") {
                throw new Error("hover(x, y) requires both numeric coordinates");
            }
            await this.page.mouse.move(targetOrX, y);
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
                await this.page.mouse.move(target.x, target.y);
                return;
            case "role_name":
                await this.roleTarget(target).hover();
                return;
            case "text":
                await this.textTarget(target).hover();
                return;
            default:
                throw new Error(`playwright_code does not support hover target kind "${target.kind}" yet`);
        }
    }
    async scroll(x, y, deltaX, deltaY) {
        await this.page.mouse.move(x, y);
        await this.page.mouse.wheel(deltaX, deltaY);
    }
    async type(targetOrText, text) {
        if (typeof targetOrText === "string" && typeof text === "undefined") {
            await this.page.keyboard.type(targetOrText);
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
                await this.page.keyboard.type(text);
                return;
            case "selector":
                await this.page.locator(target.value).type(text);
                return;
            case "coords":
                await this.page.mouse.click(target.x, target.y);
                await this.page.keyboard.type(text);
                return;
            case "role_name":
                await this.roleTarget(target).type(text);
                return;
            case "text":
                await this.textTarget(target).click();
                await this.page.keyboard.type(text);
                return;
            default:
                throw new Error(`playwright_code does not support type target kind "${target.kind}" yet`);
        }
    }
    async press(targetOrKey, key) {
        if (typeof targetOrKey === "string" && typeof key === "undefined") {
            await this.page.keyboard.press(targetOrKey);
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
                await this.page.keyboard.press(key);
                return;
            case "selector":
                await this.page.locator(target.value).click();
                await this.page.keyboard.press(key);
                return;
            case "coords":
                await this.page.mouse.click(target.x, target.y);
                await this.page.keyboard.press(key);
                return;
            case "role_name":
                await this.roleTarget(target).click();
                await this.page.keyboard.press(key);
                return;
            case "text":
                await this.textTarget(target).click();
                await this.page.keyboard.press(key);
                return;
            default:
                throw new Error(`playwright_code does not support press target kind "${target.kind}" yet`);
        }
    }
    async represent() {
        const snapshot = await this.page.accessibility.snapshot({
            interestingOnly: false,
        });
        const content = JSON.stringify(snapshot, null, 2);
        return {
            kind: "accessibility_tree",
            content,
            metadata: {
                bytes: Buffer.byteLength(content, "utf8"),
                tokenEstimate: Math.ceil(content.length / 4),
                nodeCount: countAccessibilityNodes(snapshot),
            },
            raw: snapshot,
        };
    }
}
class PlaywrightSession {
    browser;
    context;
    handles = new WeakMap();
    pageIds = new WeakMap();
    pageCounter = 0;
    activePageId = null;
    closed = false;
    constructor(browser, context, initialPage) {
        this.browser = browser;
        this.context = context;
        if (initialPage) {
            const handle = this.wrap(initialPage);
            this.activePageId = handle.id;
        }
    }
    nextPageId() {
        this.pageCounter += 1;
        return `page-${this.pageCounter}`;
    }
    wrap(page) {
        const existing = this.handles.get(page);
        if (existing)
            return existing;
        const id = this.pageIds.get(page) ?? this.nextPageId();
        this.pageIds.set(page, id);
        const handle = new PlaywrightPageHandle(page, id);
        this.handles.set(page, handle);
        return handle;
    }
    async listPages() {
        return this.context.pages().map((page) => this.wrap(page));
    }
    async activePage() {
        if (this.activePageId) {
            const active = this.context
                .pages()
                .find((candidate) => this.wrap(candidate).id === this.activePageId);
            if (active)
                return this.wrap(active);
        }
        const page = this.context.pages()[0];
        if (!page) {
            throw new Error("No active page available");
        }
        const handle = this.wrap(page);
        this.activePageId = handle.id;
        return handle;
    }
    async newPage(url) {
        const page = await this.context.newPage();
        const handle = this.wrap(page);
        this.activePageId = handle.id;
        if (url) {
            await page.goto(url);
        }
        return handle;
    }
    async selectPage(pageId) {
        const page = this.context
            .pages()
            .find((candidate) => this.wrap(candidate).id === pageId);
        if (!page) {
            throw new Error(`Unknown page id "${pageId}"`);
        }
        this.activePageId = pageId;
        await page.bringToFront();
    }
    async closePage(pageId) {
        const page = this.context
            .pages()
            .find((candidate) => this.wrap(candidate).id === pageId);
        if (!page) {
            throw new Error(`Unknown page id "${pageId}"`);
        }
        await page.close();
        if (this.activePageId === pageId) {
            this.activePageId = this.context.pages()[0]
                ? this.wrap(this.context.pages()[0]).id
                : null;
        }
    }
    async close() {
        if (this.closed)
            return;
        this.closed = true;
        await this.browser.close();
    }
    async getArtifacts() {
        return [];
    }
    async getRawMetrics() {
        return {
            pageCount: this.context.pages().length,
        };
    }
}
function connectionModeFromProfile(startupProfile, endpointKind) {
    if (startupProfile === "tool_launch_local") {
        return "launch";
    }
    if (startupProfile === "runner_provided_local_cdp" ||
        startupProfile === "runner_provided_browserbase_cdp" ||
        startupProfile === "tool_attach_local_cdp" ||
        startupProfile === "tool_attach_browserbase") {
        return endpointKind === "http" ? "attach_http" : "attach_ws";
    }
    return "launch";
}
export class PlaywrightCodeTool {
    id = "playwright_code";
    surface = "code";
    family = "playwright";
    supportedStartupProfiles = [
        "tool_launch_local",
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
        "role_name",
        "text",
    ];
    async start(input) {
        let browser;
        let context;
        let initialPage;
        if (input.startupProfile === "tool_launch_local") {
            const executablePath = resolveLocalChromeExecutablePath();
            browser = await chromium.launch({
                headless: true,
                executablePath,
                args: [
                    ...(process.env.CI ? ["--no-sandbox"] : []),
                    "--ignore-certificate-errors",
                ],
            });
            context = await browser.newContext({
                ignoreHTTPSErrors: true,
            });
            initialPage = await context.newPage();
        }
        else if (input.startupProfile === "runner_provided_local_cdp" ||
            input.startupProfile === "runner_provided_browserbase_cdp" ||
            input.startupProfile === "tool_attach_local_cdp" ||
            input.startupProfile === "tool_attach_browserbase") {
            if (!input.providedEndpoint) {
                throw new Error(`playwright_code startup profile "${input.startupProfile}" requires a providedEndpoint`);
            }
            browser = await chromium.connectOverCDP(input.providedEndpoint.url, {
                headers: input.providedEndpoint.headers,
            });
            context = browser.contexts()[0] ?? (await browser.newContext());
            initialPage = context.pages()[0] ?? (await context.newPage());
        }
        else {
            throw new Error(`playwright_code does not support startup profile "${input.startupProfile}" yet`);
        }
        const session = new PlaywrightSession(browser, context, initialPage);
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
