import { resolveLocalChromeExecutablePath } from "../targets/localChrome.js";
import { parseChromeDevtoolsListedPages, parseLooseJson, resolvePnpmCommand, StdioMcpRuntime, } from "./mcpUtils.js";
const DEFAULT_WAIT_TIMEOUT_MS = 15_000;
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
function buildSelectorResolver(selectorVar = "selector") {
    return `
    const selector = ${selectorVar};
    const toArray = (collection) => Array.isArray(collection) ? collection : Array.from(collection ?? []);
    const resolveElements = () => {
      if (selector.startsWith("xpath=")) {
        const expression = selector.slice("xpath=".length);
        const snapshot = document.evaluate(
          expression,
          document,
          null,
          XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
          null,
        );
        const elements = [];
        for (let i = 0; i < snapshot.snapshotLength; i += 1) {
          const item = snapshot.snapshotItem(i);
          if (item instanceof Element) {
            elements.push(item);
          }
        }
        return elements;
      }
      return toArray(document.querySelectorAll(selector)).filter(
        (item) => item instanceof Element,
      );
    };
    const elements = resolveElements();
    const first = elements[0] ?? null;
  `;
}
function keyName(key) {
    return key === " " ? "Space" : key;
}
function normalizeText(value) {
    return value?.replace(/\s+/g, " ").trim().toLowerCase() ?? "";
}
function parseChromeDevtoolsSnapshotEntries(text) {
    const entries = [];
    const lines = text.split(/\r?\n/);
    for (const line of lines) {
        const match = line.match(/uid=([^\s]+)\s+(.+)$/);
        if (!match)
            continue;
        const content = match[2].trim();
        const quotedMatch = content.match(/^([A-Za-z0-9_-]+)\s+"([^"]+)"/);
        const roleMatch = content.match(/^([A-Za-z0-9_-]+)/);
        const trailingText = quotedMatch
            ? content.slice(quotedMatch[0].length).trim()
            : content.slice((roleMatch?.[0] ?? "").length).trim();
        entries.push({
            uid: match[1],
            role: quotedMatch?.[1] ?? roleMatch?.[1] ?? undefined,
            name: quotedMatch?.[2] ?? undefined,
            text: trailingText || undefined,
        });
    }
    return entries;
}
function scoreChromeDevtoolsSnapshotEntry(entry, query) {
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
function findBestChromeDevtoolsSnapshotEntry(entries, query) {
    let bestEntry = null;
    let bestScore = -1;
    for (const entry of entries) {
        const score = scoreChromeDevtoolsSnapshotEntry(entry, query);
        if (score > bestScore) {
            bestEntry = entry;
            bestScore = score;
        }
    }
    return bestScore >= 0 ? bestEntry : null;
}
async function sleep(ms) {
    await new Promise((resolve) => setTimeout(resolve, ms));
}
class ChromeDevtoolsMcpLocatorHandle {
    pageHandle;
    selector;
    constructor(pageHandle, selector) {
        this.pageHandle = pageHandle;
        this.selector = selector;
    }
    async count() {
        return this.pageHandle.evaluateSelector(this.selector, "return elements.length;");
    }
    async click() {
        await this.pageHandle.click(this.selector);
    }
    async hover() {
        await this.pageHandle.hover(this.selector);
    }
    async fill(value) {
        await this.pageHandle.fillSelector(this.selector, value);
    }
    async type(text) {
        await this.pageHandle.type(this.selector, text);
    }
    async isVisible() {
        return this.pageHandle.evaluateSelector(this.selector, `
        if (!first) return false;
        const rect = first.getBoundingClientRect();
        const style = window.getComputedStyle(first);
        return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
      `);
    }
    async textContent() {
        return this.pageHandle.evaluateSelector(this.selector, "return first ? first.textContent : null;");
    }
    async inputValue() {
        return this.pageHandle.evaluateSelector(this.selector, "return first && 'value' in first ? String(first.value ?? '') : '';");
    }
}
class ChromeDevtoolsMcpPageHandle {
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
        return this.runtime.callText("take_snapshot", {});
    }
    async describeSelectorTarget(selector) {
        return this.runtime.callJson("evaluate_script", {
            function: `() => {
        ${buildSelectorResolver(serialize(selector))}
        if (!(first instanceof Element)) {
          throw new Error("Selector not found: ${escapeTemplateLiteral(selector)}");
        }

        const read = (value) => typeof value === "string" ? value.trim() : "";
        const roleFromTag = () => {
          if (first instanceof HTMLButtonElement) return "button";
          if (first instanceof HTMLAnchorElement && first.href) return "link";
          if (first instanceof HTMLTextAreaElement) return "textbox";
          if (first instanceof HTMLSelectElement) return "combobox";
          if (first instanceof HTMLInputElement) {
            const type = read(first.type).toLowerCase();
            if (!type || ["text", "search", "email", "url", "tel", "password", "number"].includes(type)) {
              return "textbox";
            }
            if (type === "checkbox") return "checkbox";
            if (type === "radio") return "radio";
            if (type === "button" || type === "submit" || type === "reset") return "button";
          }
          const tagName = read(first.nodeName).toLowerCase();
          return tagName || "";
        };

        const textContent = first instanceof HTMLElement
          ? read(first.innerText) || read(first.textContent)
          : read(first.textContent);
        const valueText =
          first instanceof HTMLInputElement || first instanceof HTMLTextAreaElement
            ? read(first.value) || read(first.placeholder)
            : "";

        return JSON.stringify({
          role: read(first.getAttribute("role")) || roleFromTag() || undefined,
          name:
            read(first.getAttribute("aria-label")) ||
            read(first.getAttribute("title")) ||
            valueText ||
            textContent ||
            undefined,
          text: textContent || valueText || undefined,
        });
      }`,
        });
    }
    async resolveTargetUid(target) {
        const query = typeof target === "string"
            ? await this.describeSelectorTarget(target)
            : target.kind === "selector"
                ? await this.describeSelectorTarget(target.value)
                : target.kind === "role_name"
                    ? { role: target.role, name: target.name }
                    : { text: target.text };
        const entries = parseChromeDevtoolsSnapshotEntries(await this.snapshotText());
        const match = findBestChromeDevtoolsSnapshotEntry(entries, query);
        if (!match) {
            throw new Error(`Unable to resolve Chrome DevTools MCP target from snapshot: ${JSON.stringify(query)}`);
        }
        return match.uid;
    }
    async evaluateJson(body) {
        const text = await this.runtime.callText("evaluate_script", {
            function: `() => { ${body} }`,
        });
        return parseLooseJson(text);
    }
    async evaluateSelector(selector, body) {
        return this.runtime.callJson("evaluate_script", {
            function: `() => {
        ${buildSelectorResolver(serialize(selector))}
        ${body}
      }`,
        });
    }
    async fillSelector(selector, value) {
        await this.runtime.callTool("fill", {
            uid: await this.resolveTargetUid(selector),
            value,
        });
    }
    async refreshUrlFromPage() {
        this.cachedUrl = await this.evaluateJson("return JSON.stringify(window.location.href);");
    }
    async goto(url, opts) {
        await this.runtime.callTool("navigate_page", {
            type: "url",
            url,
            ...(typeof opts?.timeoutMs === "number"
                ? { timeout: opts.timeoutMs }
                : {}),
        });
        this.cachedUrl = url;
    }
    async reload(opts) {
        await this.runtime.callTool("navigate_page", {
            type: "reload",
            ...(typeof opts?.timeoutMs === "number"
                ? { timeout: opts.timeoutMs }
                : {}),
        });
        await this.refreshUrlFromPage();
    }
    async back(opts) {
        await this.runtime.callTool("navigate_page", {
            type: "back",
            ...(typeof opts?.timeoutMs === "number"
                ? { timeout: opts.timeoutMs }
                : {}),
        });
        await this.refreshUrlFromPage();
        return true;
    }
    async forward(opts) {
        await this.runtime.callTool("navigate_page", {
            type: "forward",
            ...(typeof opts?.timeoutMs === "number"
                ? { timeout: opts.timeoutMs }
                : {}),
        });
        await this.refreshUrlFromPage();
        return true;
    }
    async goBack(opts) {
        return this.back(opts);
    }
    async goForward(opts) {
        return this.forward(opts);
    }
    async title() {
        return this.evaluateJson("return JSON.stringify(document.title);");
    }
    async evaluate(pageFunctionOrExpression, arg) {
        if (typeof pageFunctionOrExpression === "string") {
            const expression = escapeTemplateLiteral(pageFunctionOrExpression);
            return this.evaluateJson(`
        const value = eval(\`${expression}\`);
        return JSON.stringify(value);
      `);
        }
        return this.runtime.callJson("evaluate_script", {
            function: `() => {
        const fn = ${pageFunctionOrExpression.toString()};
        const arg = ${serialize(arg)};
        return Promise.resolve(fn(arg)).then((value) => JSON.stringify(value));
      }`,
        });
    }
    async screenshot(opts) {
        const extension = opts?.type === "jpeg" ? "jpg" : "png";
        const filename = `chrome-devtools-mcp-screenshot-${Date.now()}.${extension}`;
        const artifactPath = this.runtime.artifactPath(filename);
        await this.runtime.callTool("take_screenshot", {
            format: opts?.type ?? "png",
            fullPage: opts?.fullPage ?? false,
            filePath: artifactPath,
            ...(typeof opts?.quality === "number" ? { quality: opts.quality } : {}),
        });
        return this.runtime.readArtifact(filename);
    }
    async setViewport(size) {
        await this.runtime.callTool("emulate", {
            viewport: `${size.width}x${size.height}x1`,
        });
        const deadline = Date.now() + 2_000;
        while (Date.now() < deadline) {
            const viewport = await this.evaluateJson(`
        return JSON.stringify({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      `);
            if (viewport.width === size.width && viewport.height === size.height) {
                return;
            }
            await sleep(100);
        }
    }
    async setViewportSize(width, height) {
        await this.setViewport({ width, height });
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
                if (spec.state === "networkidle") {
                    await this.waitForTimeout(spec.timeoutMs ?? 500);
                    return;
                }
                await this.runtime.callTool("evaluate_script", {
                    function: `() => {
            return new Promise((resolve) => {
              if (document.readyState === ${serialize(spec.state === "domcontentloaded" ? "interactive" : "complete")} || document.readyState === "complete") {
                resolve(JSON.stringify(true));
                return;
              }
              window.addEventListener("load", () => resolve(JSON.stringify(true)), { once: true });
            });
          }`,
                });
                return;
            default: {
                const exhaustive = spec;
                throw new Error(`Unsupported wait spec: ${JSON.stringify(exhaustive)}`);
            }
        }
    }
    async waitForSelector(selector, opts) {
        const timeout = opts?.timeout ?? DEFAULT_WAIT_TIMEOUT_MS;
        const deadline = Date.now() + timeout;
        while (Date.now() < deadline) {
            const result = await this.evaluateSelector(selector, `
          const visible = first ? (() => {
            const rect = first.getBoundingClientRect();
            const style = window.getComputedStyle(first);
            return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
          })() : false;
          switch (${serialize(opts?.state ?? "visible")}) {
            case "attached":
              return JSON.stringify(Boolean(first));
            case "detached":
              return JSON.stringify(!first);
            case "hidden":
              return JSON.stringify(!first || !visible);
            case "visible":
            default:
              return JSON.stringify(Boolean(first) && visible);
          }
        `);
            if (result)
                return true;
            await sleep(100);
        }
        throw new Error(`Timed out waiting for selector "${selector}"`);
    }
    async waitForTimeout(ms) {
        await sleep(ms);
    }
    locator(selector) {
        return new ChromeDevtoolsMcpLocatorHandle(this, selector);
    }
    async dispatchPointerAtCoordinates(x, y, eventNames) {
        await this.runtime.callTool("evaluate_script", {
            function: `() => {
        const target = document.elementFromPoint(${x}, ${y});
        if (!(target instanceof Element)) {
          throw new Error("No element found at coordinates");
        }
        const events = ${serialize(eventNames)};
        for (const name of events) {
          target.dispatchEvent(new MouseEvent(name, {
            bubbles: true,
            cancelable: true,
            clientX: ${x},
            clientY: ${y},
            view: window,
          }));
        }
        if (target instanceof HTMLElement) target.focus();
        return JSON.stringify(true);
      }`,
        });
    }
    async click(targetOrX, y) {
        if (typeof targetOrX === "number") {
            if (typeof y !== "number") {
                throw new Error("click(x, y) requires both numeric coordinates");
            }
            await this.dispatchPointerAtCoordinates(targetOrX, y, [
                "mousedown",
                "mouseup",
                "click",
            ]);
            return;
        }
        const target = typeof targetOrX === "string"
            ? { kind: "selector", value: targetOrX }
            : targetOrX;
        switch (target.kind) {
            case "selector":
                await this.runtime.callTool("click", {
                    uid: await this.resolveTargetUid(target.value),
                });
                return;
            case "coords":
                await this.click(target.x, target.y);
                return;
            case "text":
                await this.runtime.callTool("click", {
                    uid: await this.resolveTargetUid(target),
                });
                return;
            case "role_name":
                await this.runtime.callTool("click", {
                    uid: await this.resolveTargetUid(target),
                });
                return;
            default:
                throw new Error(`chrome_devtools_mcp does not support click target kind "${target.kind}" yet`);
        }
    }
    async hover(targetOrX, y) {
        if (typeof targetOrX === "number") {
            if (typeof y !== "number") {
                throw new Error("hover(x, y) requires both numeric coordinates");
            }
            await this.dispatchPointerAtCoordinates(targetOrX, y, [
                "mousemove",
                "mouseover",
                "mouseenter",
            ]);
            return;
        }
        const target = typeof targetOrX === "string"
            ? { kind: "selector", value: targetOrX }
            : targetOrX;
        switch (target.kind) {
            case "selector":
                await this.runtime.callTool("hover", {
                    uid: await this.resolveTargetUid(target.value),
                });
                return;
            case "coords":
                await this.hover(target.x, target.y);
                return;
            case "text":
                await this.runtime.callTool("hover", {
                    uid: await this.resolveTargetUid(target),
                });
                return;
            case "role_name":
                await this.runtime.callTool("hover", {
                    uid: await this.resolveTargetUid(target),
                });
                return;
            default:
                throw new Error(`chrome_devtools_mcp does not support hover target kind "${target.kind}" yet`);
        }
    }
    async scroll(_x, _y, deltaX, deltaY) {
        await this.runtime.callTool("evaluate_script", {
            function: `() => {
        window.scrollBy(${deltaX}, ${deltaY});
        return JSON.stringify(window.scrollY);
      }`,
        });
    }
    async type(targetOrText, text) {
        if (typeof targetOrText === "string" && typeof text === "undefined") {
            await this.runtime.callTool("type_text", {
                text: targetOrText,
            });
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
                await this.runtime.callTool("type_text", { text });
                return;
            case "selector":
                await this.fillSelector(target.value, text);
                return;
            case "coords":
                await this.click(target.x, target.y);
                await this.runtime.callTool("type_text", { text });
                return;
            case "text":
            case "role_name":
                await this.click(target);
                await this.runtime.callTool("type_text", { text });
                return;
            default:
                throw new Error(`chrome_devtools_mcp does not support type target kind "${target.kind}" yet`);
        }
    }
    async press(targetOrKey, key) {
        if (typeof targetOrKey === "string" && typeof key === "undefined") {
            await this.runtime.callTool("press_key", { key: keyName(targetOrKey) });
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
                await this.runtime.callTool("press_key", { key: keyName(key) });
                return;
            case "selector":
            case "coords":
            case "text":
            case "role_name":
                await this.click(target);
                await this.runtime.callTool("press_key", { key: keyName(key) });
                return;
            default:
                throw new Error(`chrome_devtools_mcp does not support press target kind "${target.kind}" yet`);
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
class ChromeDevtoolsMcpSession {
    runtime;
    pages = new Map();
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
    findOrCreateTrackedPage(input) {
        const existing = [...this.pages.values()].find((page) => {
            return (typeof input.toolPageId === "number" &&
                page.toolPageId === input.toolPageId);
        });
        if (existing) {
            existing.handle.setCachedUrl(input.url);
            return existing;
        }
        const tracked = {
            id: this.nextPageId(),
            toolPageId: input.toolPageId,
            handle: new ChromeDevtoolsMcpPageHandle(this.runtime, "", input.url),
        };
        tracked.handle = new ChromeDevtoolsMcpPageHandle(this.runtime, tracked.id, input.url);
        this.pages.set(tracked.id, tracked);
        return tracked;
    }
    async syncPagesFromTool() {
        const text = await this.runtime.callText("list_pages", {});
        const listed = parseChromeDevtoolsListedPages(text);
        if (!listed.length) {
            if (!this.pages.size) {
                const seeded = this.findOrCreateTrackedPage({ url: "about:blank" });
                this.activePageId = seeded.id;
            }
            return;
        }
        const seenIds = new Set();
        for (const page of listed) {
            seenIds.add(page.toolPageId);
            this.findOrCreateTrackedPage(page);
        }
        for (const [id, tracked] of this.pages.entries()) {
            if (typeof tracked.toolPageId !== "number")
                continue;
            if (seenIds.has(tracked.toolPageId))
                continue;
            this.pages.delete(id);
            if (this.activePageId === id) {
                this.activePageId = null;
            }
        }
        if (!this.activePageId) {
            const first = listed[0];
            this.activePageId = this.findOrCreateTrackedPage(first).id;
        }
    }
    async initialize() {
        await this.syncPagesFromTool();
    }
    async listPages() {
        await this.syncPagesFromTool();
        return [...this.pages.values()].map((tracked) => tracked.handle);
    }
    async activePage() {
        await this.syncPagesFromTool();
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
        await this.runtime.callTool("new_page", {
            url: url ?? "about:blank",
        });
        const beforeIds = new Set([...this.pages.values()]
            .map((page) => page.toolPageId)
            .filter((value) => typeof value === "number"));
        await this.syncPagesFromTool();
        const created = [...this.pages.values()].find((page) => {
            return (typeof page.toolPageId === "number" && !beforeIds.has(page.toolPageId));
        }) ?? [...this.pages.values()].at(-1);
        if (!created) {
            throw new Error("new_page did not create a page");
        }
        this.activePageId = created.id;
        return created.handle;
    }
    async selectPage(pageId) {
        await this.syncPagesFromTool();
        const tracked = this.pages.get(pageId);
        if (!tracked || typeof tracked.toolPageId !== "number") {
            throw new Error(`Unknown page id "${pageId}"`);
        }
        await this.runtime.callTool("select_page", {
            pageId: tracked.toolPageId,
            bringToFront: true,
        });
        this.activePageId = pageId;
        tracked.handle.setCachedUrl(await tracked.handle.evaluate("window.location.href"));
    }
    async closePage(pageId) {
        await this.syncPagesFromTool();
        const tracked = this.pages.get(pageId);
        if (!tracked || typeof tracked.toolPageId !== "number") {
            throw new Error(`Unknown page id "${pageId}"`);
        }
        await this.runtime.callTool("close_page", {
            pageId: tracked.toolPageId,
        });
        this.pages.delete(pageId);
        if (this.activePageId === pageId) {
            this.activePageId = null;
        }
        await this.syncPagesFromTool();
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
function buildChromeDevtoolsMcpArgs(input) {
    const args = [
        "dlx",
        "chrome-devtools-mcp@latest",
        "--no-usage-statistics",
        "--no-performance-crux",
    ];
    if (input.startupProfile === "runner_provided_local_cdp" ||
        input.startupProfile === "runner_provided_browserbase_cdp" ||
        input.startupProfile === "tool_attach_local_cdp" ||
        input.startupProfile === "tool_attach_browserbase") {
        if (!input.providedEndpoint) {
            throw new Error(`chrome_devtools_mcp startup profile "${input.startupProfile}" requires a providedEndpoint`);
        }
        if (input.providedEndpoint.kind === "ws") {
            args.push("--wsEndpoint", input.providedEndpoint.url);
            if (input.providedEndpoint.headers) {
                args.push("--wsHeaders", JSON.stringify(input.providedEndpoint.headers));
            }
        }
        else {
            args.push("--browserUrl", input.providedEndpoint.url);
        }
    }
    else if (input.startupProfile === "tool_launch_local") {
        args.push("--headless", "--isolated");
        const executablePath = resolveLocalChromeExecutablePath();
        if (executablePath) {
            args.push("--executablePath", executablePath);
        }
        if (process.env.CI) {
            args.push("--chromeArg=--no-sandbox");
            args.push("--chromeArg=--disable-setuid-sandbox");
        }
    }
    else {
        throw new Error(`chrome_devtools_mcp does not support startup profile "${input.startupProfile}" yet`);
    }
    return args;
}
export class ChromeDevtoolsMcpTool {
    id = "chrome_devtools_mcp";
    surface = "mcp";
    family = "chrome_devtools";
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
            args: buildChromeDevtoolsMcpArgs(input),
        });
        const session = new ChromeDevtoolsMcpSession(runtime);
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
