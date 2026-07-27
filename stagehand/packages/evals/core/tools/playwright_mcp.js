import { resolveLocalChromeExecutablePath } from "../targets/localChrome.js";
import { extractMcpImage, resolvePnpmCommand, StdioMcpRuntime, } from "./mcpUtils.js";
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
function serialize(value) {
    return JSON.stringify(value);
}
function escapeTemplateLiteral(value) {
    return value.replaceAll("\\", "\\\\").replaceAll("`", "\\`");
}
function selectorExpression(selector) {
    return serialize(selector);
}
function historyWaitUntil(waitUntil) {
    return waitUntil ?? "domcontentloaded";
}
function buildPlaywrightSelectorResolver(selectorVar = "selector") {
    return `
    const selector = ${selectorVar};
    if (selector.startsWith("xpath=")) {
      return page.locator(selector);
    }
    return page.locator(selector);
  `;
}
function normalizeText(value) {
    return value?.replace(/\s+/g, " ").trim().toLowerCase() ?? "";
}
function parsePlaywrightListedPages(text) {
    const pages = [];
    const lines = text.split(/\r?\n/);
    for (const line of lines) {
        const match = line.match(/^\s*-\s*(\d+):\s*(\(current\)\s*)?\[[^\]]*]\(([^)]+)\)/);
        if (!match)
            continue;
        pages.push({
            index: Number(match[1]),
            current: Boolean(match[2]),
            url: match[3],
        });
    }
    return pages.sort((left, right) => left.index - right.index);
}
function parsePlaywrightSnapshotEntries(text) {
    const entries = [];
    const lines = text.split(/\r?\n/);
    for (const line of lines) {
        const refMatch = line.match(/\[ref=([^\]]+)\]/);
        if (!refMatch)
            continue;
        const withoutPrefix = line.replace(/^\s*-\s*/, "");
        const beforeRef = withoutPrefix.replace(/\s*\[ref=[^\]]+\]/, "").trim();
        const [content, trailingText] = beforeRef.split(/\s*:\s*/, 2);
        let role;
        let name;
        const quotedMatch = content.match(/^([a-zA-Z0-9_-]+)\s+"([^"]+)"/);
        if (quotedMatch) {
            role = quotedMatch[1];
            name = quotedMatch[2];
        }
        else {
            const roleMatch = content.match(/^([a-zA-Z0-9_-]+)/);
            role = roleMatch?.[1] ?? "";
        }
        entries.push({
            ref: refMatch[1],
            role: role || undefined,
            name: name || undefined,
            text: trailingText?.trim() || undefined,
        });
    }
    return entries;
}
function scorePlaywrightSnapshotEntry(entry, query) {
    let score = 0;
    if (query.role) {
        if (normalizeText(entry.role) !== normalizeText(query.role)) {
            return -1;
        }
        score += 3;
    }
    if (query.name) {
        const expected = normalizeText(query.name);
        const candidates = [entry.name, entry.text]
            .map(normalizeText)
            .filter(Boolean);
        if (!candidates.length) {
            return -1;
        }
        if (candidates.includes(expected)) {
            score += 6;
        }
        else if (candidates.some((candidate) => candidate.includes(expected))) {
            score += 4;
        }
        else {
            return -1;
        }
    }
    if (query.text) {
        const expected = normalizeText(query.text);
        const candidates = [entry.text, entry.name]
            .map(normalizeText)
            .filter(Boolean);
        if (!candidates.length) {
            return -1;
        }
        if (candidates.includes(expected)) {
            score += 6;
        }
        else if (candidates.some((candidate) => candidate.includes(expected))) {
            score += 4;
        }
        else {
            return -1;
        }
    }
    return score;
}
function findBestPlaywrightSnapshotEntry(entries, query) {
    let bestEntry = null;
    let bestScore = -1;
    for (const entry of entries) {
        const score = scorePlaywrightSnapshotEntry(entry, query);
        if (score > bestScore) {
            bestEntry = entry;
            bestScore = score;
        }
    }
    return bestScore >= 0 ? bestEntry : null;
}
class PlaywrightMcpLocatorHandle {
    pageHandle;
    selector;
    constructor(pageHandle, selector) {
        this.pageHandle = pageHandle;
        this.selector = selector;
    }
    async count() {
        return this.pageHandle.runCodeJson(`
      async (page) => {
        const selector = ${selectorExpression(this.selector)};
        ${buildPlaywrightSelectorResolver("selector")}
        return await page.locator(selector).count();
      }
    `);
    }
    async click() {
        await this.pageHandle.click(this.selector);
    }
    async hover() {
        await this.pageHandle.hover(this.selector);
    }
    async fill(value) {
        await this.pageHandle.runCode(`
      async (page) => {
        const selector = ${selectorExpression(this.selector)};
        await page.locator(selector).fill(${serialize(value)});
      }
    `);
    }
    async type(text, opts) {
        await this.pageHandle.runCode(`
      async (page) => {
        const selector = ${selectorExpression(this.selector)};
        await page.locator(selector).type(${serialize(text)}, ${serialize(opts ?? {})});
      }
    `);
    }
    async isVisible() {
        return this.pageHandle.runCodeJson(`
      async (page) => {
        const selector = ${selectorExpression(this.selector)};
        return await page.locator(selector).isVisible();
      }
    `);
    }
    async textContent() {
        return this.pageHandle.runCodeJson(`
      async (page) => {
        const selector = ${selectorExpression(this.selector)};
        return await page.locator(selector).textContent();
      }
    `);
    }
    async inputValue() {
        return this.pageHandle.runCodeJson(`
      async (page) => {
        const selector = ${selectorExpression(this.selector)};
        return await page.locator(selector).inputValue();
      }
    `);
    }
}
class PlaywrightMcpPageHandle {
    runtime;
    id;
    cachedUrl;
    constructor(runtime, id, cachedUrl = "about:blank") {
        this.runtime = runtime;
        this.id = id;
        this.cachedUrl = cachedUrl;
    }
    setCachedUrl(url) {
        this.cachedUrl = url;
    }
    url() {
        return this.cachedUrl;
    }
    async snapshotText() {
        return this.runtime.callText("browser_snapshot", {});
    }
    async describeSelectorTarget(selector) {
        return this.runCodeJson(`
      async (page) => {
        const selector = ${selectorExpression(selector)};
        const locator = page.locator(selector).first();
        await locator.waitFor({ state: "attached" });
        const description = await locator.evaluate((node) => {
          const read = (value) => typeof value === "string" ? value.trim() : "";
          const roleFromTag = () => {
            if (node instanceof HTMLButtonElement) return "button";
            if (node instanceof HTMLAnchorElement && node.href) return "link";
            if (node instanceof HTMLTextAreaElement) return "textbox";
            if (node instanceof HTMLSelectElement) return "combobox";
            if (node instanceof HTMLInputElement) {
              const type = read(node.type).toLowerCase();
              if (!type || ["text", "search", "email", "url", "tel", "password", "number"].includes(type)) {
                return "textbox";
              }
              if (type === "checkbox") return "checkbox";
              if (type === "radio") return "radio";
              if (type === "button" || type === "submit" || type === "reset") return "button";
            }
            const tagName = read(node.nodeName).toLowerCase();
            return tagName || "";
          };

          const textContent = node instanceof HTMLElement
            ? read(node.innerText) || read(node.textContent)
            : read(node.textContent);
          const valueText =
            node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement
              ? read(node.value) || read(node.placeholder)
              : "";
          const description = {
            role: read(node.getAttribute?.("role")) || roleFromTag() || undefined,
            name:
              read(node.getAttribute?.("aria-label")) ||
              read(node.getAttribute?.("title")) ||
              valueText ||
              textContent ||
              undefined,
            text: textContent || valueText || undefined,
          };

          return JSON.stringify(description);
        });

        return JSON.stringify(description);
      }
    `);
    }
    async resolveTargetRef(target) {
        const query = typeof target === "string"
            ? await this.describeSelectorTarget(target)
            : target.kind === "selector"
                ? await this.describeSelectorTarget(target.value)
                : target.kind === "role_name"
                    ? { role: target.role, name: target.name }
                    : { text: target.text };
        const entries = parsePlaywrightSnapshotEntries(await this.snapshotText());
        const match = findBestPlaywrightSnapshotEntry(entries, query);
        if (!match) {
            throw new Error(`Unable to resolve Playwright MCP target from snapshot: ${JSON.stringify(query)}`);
        }
        return match.ref;
    }
    async runCode(code) {
        const text = await this.runtime.callText("browser_run_code", {
            code,
        });
        return text;
    }
    async runCodeJson(code) {
        return this.runtime.callJson("browser_run_code", {
            code,
        });
    }
    async waitForHistoryNavigation(previousUrl, opts) {
        const deadline = Date.now() + (opts?.timeoutMs ?? 30_000);
        while (Date.now() < deadline) {
            await this.refreshUrlFromPage();
            if (this.cachedUrl !== previousUrl) {
                const desiredState = historyWaitUntil(opts?.waitUntil);
                while (Date.now() < deadline) {
                    const readyState = await this.runCodeJson(`
            async (page) => JSON.stringify(await page.evaluate(() => document.readyState))
          `);
                    if (desiredState === "domcontentloaded"
                        ? readyState !== "loading"
                        : readyState === "complete") {
                        return true;
                    }
                    await this.waitForTimeout(100);
                }
                break;
            }
            await this.waitForTimeout(100);
        }
        return false;
    }
    async refreshUrlFromPage() {
        this.cachedUrl = await this.runCodeJson(`
      async (page) => JSON.stringify(page.url())
    `);
    }
    async goto(url, opts) {
        void opts;
        await this.runtime.callTool("browser_navigate", { url });
        this.cachedUrl = url;
    }
    async reload(opts) {
        void opts;
        await this.runCode(`
      async (page) => {
        await page.reload();
        return JSON.stringify(page.url());
      }
    `);
        await this.refreshUrlFromPage();
    }
    async back(opts) {
        const previousUrl = this.cachedUrl;
        await this.runCode(`
      async (page) => {
        await page.evaluate(() => history.back());
        return JSON.stringify(true);
      }
    `);
        return this.waitForHistoryNavigation(previousUrl, opts);
    }
    async forward(opts) {
        const previousUrl = this.cachedUrl;
        await this.runCode(`
      async (page) => {
        await page.evaluate(() => history.forward());
        return JSON.stringify(true);
      }
    `);
        return this.waitForHistoryNavigation(previousUrl, opts);
    }
    async goBack(opts) {
        return this.back(opts);
    }
    async goForward(opts) {
        return this.forward(opts);
    }
    async title() {
        return this.runCodeJson(`
      async (page) => JSON.stringify(await page.title())
    `);
    }
    async evaluate(pageFunctionOrExpression, arg) {
        if (typeof pageFunctionOrExpression === "string") {
            const expression = escapeTemplateLiteral(pageFunctionOrExpression);
            return this.runCodeJson(`
        async (page) => {
          const value = await page.evaluate(() => {
            return eval(\`${expression}\`);
          });
          return JSON.stringify(value);
        }
      `);
        }
        return this.runCodeJson(`
      async (page) => {
        const fn = ${pageFunctionOrExpression.toString()};
        const arg = ${serialize(arg)};
        const value = await page.evaluate(fn, arg);
        return JSON.stringify(value);
      }
    `);
    }
    async screenshot(opts) {
        const result = await this.runtime.callTool("browser_take_screenshot", {
            type: opts?.type ?? "png",
            fullPage: opts?.fullPage ?? false,
            ...(typeof opts?.quality === "number" ? { quality: opts.quality } : {}),
        });
        const image = extractMcpImage(result);
        if (!image) {
            throw new Error("playwright_mcp screenshot did not return image content");
        }
        return Buffer.from(image.data, "base64");
    }
    async setViewport(size) {
        await this.runtime.callTool("browser_resize", size);
    }
    async setViewportSize(width, height) {
        await this.setViewport({ width, height });
    }
    async wait(spec) {
        switch (spec.kind) {
            case "selector":
                await this.runCode(`
          async (page) => {
            await page.waitForSelector(${selectorExpression(spec.selector)}, ${serialize({
                    timeout: spec.timeoutMs,
                    state: spec.state,
                })});
            return JSON.stringify(true);
          }
        `);
                return;
            case "timeout":
                await this.waitForTimeout(spec.timeoutMs);
                return;
            case "load_state":
                await this.runCode(`
          async (page) => {
            await page.waitForLoadState(${serialize(spec.state)}, ${serialize({
                    timeout: spec.timeoutMs,
                })});
            return JSON.stringify(true);
          }
        `);
                return;
            default: {
                const exhaustive = spec;
                throw new Error(`Unsupported wait spec: ${JSON.stringify(exhaustive)}`);
            }
        }
    }
    async waitForSelector(selector, opts) {
        await this.runCode(`
      async (page) => {
        await page.waitForSelector(${selectorExpression(selector)}, ${serialize(opts ?? {})});
        return JSON.stringify(true);
      }
    `);
        return true;
    }
    async waitForTimeout(ms) {
        await this.runtime.callTool("browser_wait_for", {
            time: ms / 1000,
        });
    }
    locator(selector) {
        return new PlaywrightMcpLocatorHandle(this, selector);
    }
    async performTargetedAction(target, action) {
        const normalized = typeof target === "string"
            ? { kind: "selector", value: target }
            : target;
        switch (normalized.kind) {
            case "selector":
                await this.runtime.callTool(action === "click" ? "browser_click" : "browser_hover", { ref: await this.resolveTargetRef(normalized.value) });
                return;
            case "coords":
                await this.runCode(`
          async (page) => {
            await page.mouse.${action === "click" ? "click" : "move"}(${normalized.x}, ${normalized.y});
          }
        `);
                return;
            case "role_name":
                await this.runtime.callTool(action === "click" ? "browser_click" : "browser_hover", { ref: await this.resolveTargetRef(normalized) });
                return;
            case "text":
                await this.runtime.callTool(action === "click" ? "browser_click" : "browser_hover", { ref: await this.resolveTargetRef(normalized) });
                return;
            default:
                throw new Error(`playwright_mcp does not support ${action} target kind "${normalized.kind}" yet`);
        }
    }
    async click(targetOrX, y) {
        if (typeof targetOrX === "number") {
            if (typeof y !== "number") {
                throw new Error("click(x, y) requires both numeric coordinates");
            }
            await this.runCode(`
        async (page) => {
          await page.mouse.move(${targetOrX}, ${y});
          await page.mouse.down();
          await page.mouse.up();
        }
      `);
            return;
        }
        await this.performTargetedAction(targetOrX, "click");
    }
    async hover(targetOrX, y) {
        if (typeof targetOrX === "number") {
            if (typeof y !== "number") {
                throw new Error("hover(x, y) requires both numeric coordinates");
            }
            await this.runCode(`
        async (page) => {
          await page.mouse.move(${targetOrX}, ${y});
        }
      `);
            return;
        }
        await this.performTargetedAction(targetOrX, "hover");
    }
    async scroll(x, y, deltaX, deltaY) {
        await this.runCode(`
      async (page) => {
        await page.mouse.move(${x}, ${y});
        await page.mouse.wheel(${deltaX}, ${deltaY});
      }
    `);
    }
    async type(targetOrText, text) {
        if (typeof targetOrText === "string" && typeof text === "undefined") {
            await this.runtime.callTool("browser_press_key", { key: targetOrText });
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
                await this.runCode(`
          async (page) => {
            await page.keyboard.type(${serialize(text)});
          }
        `);
                return;
            case "selector":
                await this.runtime.callTool("browser_type", {
                    ref: await this.resolveTargetRef(target.value),
                    text,
                });
                return;
            case "coords":
                await this.runCode(`
          async (page) => {
            await page.mouse.click(${target.x}, ${target.y});
            await page.keyboard.type(${serialize(text)});
          }
        `);
                return;
            case "role_name":
                await this.runtime.callTool("browser_type", {
                    ref: await this.resolveTargetRef(target),
                    text,
                });
                return;
            case "text":
                await this.runtime.callTool("browser_type", {
                    ref: await this.resolveTargetRef(target),
                    text,
                });
                return;
            default:
                throw new Error(`playwright_mcp does not support type target kind "${target.kind}" yet`);
        }
    }
    async press(targetOrKey, key) {
        if (typeof targetOrKey === "string" && typeof key === "undefined") {
            await this.runtime.callTool("browser_press_key", { key: targetOrKey });
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
                await this.runtime.callTool("browser_press_key", { key });
                return;
            case "selector":
                await this.runtime.callTool("browser_click", {
                    ref: await this.resolveTargetRef(target.value),
                });
                await this.runtime.callTool("browser_press_key", { key });
                return;
            case "coords":
                await this.runCode(`
          async (page) => {
            await page.mouse.click(${target.x}, ${target.y});
            await page.keyboard.press(${serialize(key)});
          }
        `);
                return;
            case "role_name":
                await this.runtime.callTool("browser_click", {
                    ref: await this.resolveTargetRef(target),
                });
                await this.runtime.callTool("browser_press_key", { key });
                return;
            case "text":
                await this.runtime.callTool("browser_click", {
                    ref: await this.resolveTargetRef(target),
                });
                await this.runtime.callTool("browser_press_key", { key });
                return;
            default:
                throw new Error(`playwright_mcp does not support press target kind "${target.kind}" yet`);
        }
    }
    async represent() {
        const content = await this.snapshotText();
        return {
            kind: "snapshot_refs",
            content,
            metadata: {
                bytes: Buffer.byteLength(content, "utf8"),
                tokenEstimate: Math.ceil(content.length / 4),
            },
        };
    }
}
class PlaywrightMcpSession {
    runtime;
    pages = new Map();
    pagesByIndex = new Map();
    pageCounter = 0;
    activePageId = null;
    closed = false;
    constructor(runtime) {
        this.runtime = runtime;
    }
    nextPageId() {
        this.pageCounter += 1;
        return `page-${this.pageCounter}`;
    }
    findOrCreatePage(index, url) {
        const existing = this.pagesByIndex.get(index);
        if (existing) {
            existing.handle.setCachedUrl(url);
            return existing;
        }
        const tracked = {
            id: this.nextPageId(),
            index,
            handle: new PlaywrightMcpPageHandle(this.runtime, "", url),
        };
        tracked.handle = new PlaywrightMcpPageHandle(this.runtime, tracked.id, url);
        this.pages.set(tracked.id, tracked);
        this.pagesByIndex.set(index, tracked);
        return tracked;
    }
    async syncPages() {
        const listed = parsePlaywrightListedPages(await this.runtime.callText("browser_tabs", { action: "list" }));
        const seenIndexes = new Set();
        for (const item of listed) {
            seenIndexes.add(item.index);
            this.findOrCreatePage(item.index, item.url);
        }
        for (const [index, tracked] of this.pagesByIndex.entries()) {
            if (seenIndexes.has(index))
                continue;
            this.pagesByIndex.delete(index);
            this.pages.delete(tracked.id);
            if (this.activePageId === tracked.id) {
                this.activePageId = null;
            }
        }
        const current = listed.find((page) => page.current);
        if (current) {
            this.activePageId = this.findOrCreatePage(current.index, current.url).id;
            return;
        }
        if (!this.activePageId && listed[0]) {
            this.activePageId = this.findOrCreatePage(listed[0].index, listed[0].url).id;
        }
    }
    async initialize() {
        await this.syncPages();
    }
    async listPages() {
        await this.syncPages();
        return [...this.pagesByIndex.values()]
            .sort((left, right) => left.index - right.index)
            .map((tracked) => tracked.handle);
    }
    async activePage() {
        await this.syncPages();
        if (!this.activePageId) {
            throw new Error("No active page available");
        }
        const active = this.pages.get(this.activePageId);
        if (!active) {
            throw new Error(`Unknown active page "${this.activePageId}"`);
        }
        return active.handle;
    }
    async newPage(url) {
        await this.runtime.callTool("browser_tabs", { action: "new" });
        await this.syncPages();
        const pages = [...this.pagesByIndex.values()].sort((left, right) => left.index - right.index);
        const created = pages[pages.length - 1];
        if (!created) {
            throw new Error("browser_tabs(new) did not create a page");
        }
        this.activePageId = created.id;
        if (url) {
            await created.handle.goto(url);
        }
        return created.handle;
    }
    async selectPage(pageId) {
        await this.syncPages();
        const tracked = this.pages.get(pageId);
        if (!tracked) {
            throw new Error(`Unknown page id "${pageId}"`);
        }
        await this.runtime.callTool("browser_tabs", {
            action: "select",
            index: tracked.index,
        });
        await this.syncPages();
        this.activePageId = pageId;
    }
    async closePage(pageId) {
        await this.syncPages();
        const tracked = this.pages.get(pageId);
        if (!tracked) {
            throw new Error(`Unknown page id "${pageId}"`);
        }
        await this.runtime.callTool("browser_tabs", {
            action: "close",
            index: tracked.index,
        });
        this.pages.delete(pageId);
        this.pagesByIndex.delete(tracked.index);
        if (this.activePageId === pageId) {
            this.activePageId = null;
        }
        await this.syncPages();
    }
    async close() {
        if (this.closed)
            return;
        this.closed = true;
        await this.runtime.close();
    }
    async getArtifacts() {
        return [];
    }
    async getRawMetrics() {
        const pages = await this.listPages();
        return {
            pageCount: pages.length,
        };
    }
}
function buildPlaywrightMcpArgs(input) {
    const args = ["dlx", "@playwright/mcp@latest"];
    if (input.startupProfile === "runner_provided_local_cdp" ||
        input.startupProfile === "runner_provided_browserbase_cdp" ||
        input.startupProfile === "tool_attach_local_cdp" ||
        input.startupProfile === "tool_attach_browserbase") {
        if (!input.providedEndpoint) {
            throw new Error(`playwright_mcp startup profile "${input.startupProfile}" requires a providedEndpoint`);
        }
        args.push("--cdp-endpoint", input.providedEndpoint.url);
        for (const [key, value] of Object.entries(input.providedEndpoint.headers ?? {})) {
            args.push("--cdp-header", `${key}:${value}`);
        }
    }
    else if (input.startupProfile === "tool_launch_local") {
        args.push("--headless", "--browser", "chrome", "--isolated");
        const executablePath = resolveLocalChromeExecutablePath();
        if (executablePath) {
            args.push("--executable-path", executablePath);
        }
        if (process.env.CI) {
            args.push("--no-sandbox");
        }
    }
    else {
        throw new Error(`playwright_mcp does not support startup profile "${input.startupProfile}" yet`);
    }
    return args;
}
export class PlaywrightMcpTool {
    id = "playwright_mcp";
    surface = "mcp";
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
        const runtime = await StdioMcpRuntime.connect({
            command: resolvePnpmCommand(),
            args: buildPlaywrightMcpArgs(input),
        });
        const session = new PlaywrightMcpSession(runtime);
        await session.initialize();
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
