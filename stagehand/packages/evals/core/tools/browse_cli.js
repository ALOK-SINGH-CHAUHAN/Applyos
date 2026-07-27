import { execFile } from "node:child_process";
import fs from "node:fs";
import { promisify } from "node:util";
import path from "node:path";
import { getRepoRootDir } from "../../runtimePaths.js";
const execFileAsync = promisify(execFile);
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
const BROWSE_CLI_ENTRYPOINT = path.join(getRepoRootDir(), "packages", "cli", "bin", "run.js");
const BROWSE_CLI_BUILD_ARTIFACTS = [
    path.join(getRepoRootDir(), "packages", "cli", "oclif.manifest.json"),
    path.join(getRepoRootDir(), "packages", "cli", "dist", "commands", "open.js"),
];
function resolveBrowseCliEntrypoint() {
    const missingArtifact = BROWSE_CLI_BUILD_ARTIFACTS.find((artifact) => !fs.existsSync(artifact));
    if (missingArtifact) {
        throw new Error(`browse_cli requires built CLI artifacts; missing ${missingArtifact}. Run pnpm --dir packages/cli build first.`);
    }
    return BROWSE_CLI_ENTRYPOINT;
}
function serializeArg(value) {
    return typeof value === "undefined" ? "undefined" : JSON.stringify(value);
}
function buildSelectorQuery(selector) {
    return `
    const selector = ${JSON.stringify(selector)};
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
      return Array.from(document.querySelectorAll(selector));
    };
    const elements = resolveElements();
    const first = elements[0] ?? null;
  `;
}
class BrowseCliRuntime {
    session;
    constructor(session) {
        this.session = session;
    }
    async runJson(args) {
        const { stdout, stderr } = await execFileAsync(process.execPath, [
            resolveBrowseCliEntrypoint(),
            "--json",
            "--session",
            this.session,
            ...args,
        ], {
            cwd: getRepoRootDir(),
            env: process.env,
            maxBuffer: 10 * 1024 * 1024,
        });
        const trimmed = stdout.trim();
        if (!trimmed) {
            const detail = stderr.trim();
            throw new Error(detail || `browse ${args.join(" ")} returned no JSON output`);
        }
        return JSON.parse(trimmed);
    }
}
class BrowseCliLocatorHandle {
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
        await this.pageHandle.type(this.selector, value);
    }
    async type(text) {
        await this.pageHandle.type(this.selector, text);
    }
    async isVisible() {
        return this.pageHandle
            .runCommandAfterSelecting(["is", "visible", this.selector])
            .then((result) => result.visible);
    }
    async textContent() {
        return this.pageHandle
            .runCommandAfterSelecting(["get", "text", this.selector])
            .then((result) => result.text ?? null);
    }
    async inputValue() {
        return this.pageHandle
            .runCommandAfterSelecting(["get", "value", this.selector])
            .then((result) => result.value);
    }
}
class BrowseCliPageHandle {
    session;
    id;
    cachedUrl;
    constructor(session, id, cachedUrl = "about:blank") {
        this.session = session;
        this.id = id;
        this.cachedUrl = cachedUrl;
    }
    setCachedUrl(url) {
        this.cachedUrl = url;
    }
    url() {
        return this.cachedUrl;
    }
    async runCommandAfterSelecting(args) {
        await this.session.selectIfNeeded(this.id);
        return this.session.runtime.runJson(args);
    }
    async refreshUrl() {
        const result = await this.runCommandAfterSelecting([
            "get",
            "url",
        ]);
        this.cachedUrl = result.url;
    }
    async evaluateSelector(selector, body) {
        return this.evaluate(`
      (() => {
        ${buildSelectorQuery(selector)}
        ${body}
      })()
    `);
    }
    async goto(url, opts) {
        const args = ["open", url];
        if (opts?.waitUntil) {
            args.push("--wait", opts.waitUntil);
        }
        if (typeof opts?.timeoutMs === "number") {
            args.push("-t", String(opts.timeoutMs));
        }
        const result = await this.runCommandAfterSelecting(args);
        this.cachedUrl = result.url;
    }
    async reload(opts) {
        void opts;
        const result = await this.runCommandAfterSelecting([
            "reload",
        ]);
        this.cachedUrl = result.url;
    }
    async back(opts) {
        void opts;
        const result = await this.runCommandAfterSelecting([
            "back",
        ]);
        this.cachedUrl = result.url;
        return true;
    }
    async forward(opts) {
        void opts;
        const result = await this.runCommandAfterSelecting([
            "forward",
        ]);
        this.cachedUrl = result.url;
        return true;
    }
    async goBack(opts) {
        return this.back(opts);
    }
    async goForward(opts) {
        return this.forward(opts);
    }
    async title() {
        const result = await this.runCommandAfterSelecting([
            "get",
            "title",
        ]);
        return result.title;
    }
    async evaluate(pageFunctionOrExpression, arg) {
        const expression = typeof pageFunctionOrExpression === "string"
            ? pageFunctionOrExpression
            : `(${pageFunctionOrExpression.toString()})(${serializeArg(arg)})`;
        const result = await this.runCommandAfterSelecting([
            "eval",
            expression,
        ]);
        return result.result;
    }
    async screenshot(opts) {
        const args = ["screenshot"];
        if (opts?.fullPage) {
            args.push("-f");
        }
        if (opts?.type) {
            args.push("-t", opts.type);
        }
        if (typeof opts?.quality === "number") {
            args.push("-q", String(opts.quality));
        }
        const result = await this.runCommandAfterSelecting(args);
        return Buffer.from(result.base64, "base64");
    }
    async setViewport(size) {
        await this.runCommandAfterSelecting([
            "viewport",
            String(size.width),
            String(size.height),
        ]);
    }
    async setViewportSize(width, height) {
        await this.setViewport({ width, height });
    }
    async wait(spec) {
        switch (spec.kind) {
            case "selector":
                await this.runCommandAfterSelecting([
                    "wait",
                    "selector",
                    spec.selector,
                    "-t",
                    String(spec.timeoutMs ?? 30_000),
                    "-s",
                    spec.state ?? "visible",
                ]);
                return;
            case "timeout":
                await this.runCommandAfterSelecting([
                    "wait",
                    "timeout",
                    String(spec.timeoutMs),
                ]);
                return;
            case "load_state":
                await this.runCommandAfterSelecting([
                    "wait",
                    "load",
                    spec.state,
                    "-t",
                    String(spec.timeoutMs ?? 30_000),
                ]);
                return;
            default: {
                const exhaustive = spec;
                throw new Error(`Unsupported wait spec: ${JSON.stringify(exhaustive)}`);
            }
        }
    }
    async waitForSelector(selector, opts) {
        await this.wait({
            kind: "selector",
            selector,
            timeoutMs: opts?.timeout,
            state: opts?.state,
        });
        return true;
    }
    async waitForTimeout(ms) {
        await this.wait({ kind: "timeout", timeoutMs: ms });
    }
    locator(selector) {
        return new BrowseCliLocatorHandle(this, selector);
    }
    refSelector(ref) {
        return ref.startsWith("@") ? ref : `@${ref}`;
    }
    async resolveHoverPoint(selector) {
        return this.runCommandAfterSelecting([
            "get",
            "box",
            selector,
        ]);
    }
    async click(targetOrX, y) {
        if (typeof targetOrX === "number") {
            if (typeof y !== "number") {
                throw new Error("click(x, y) requires both numeric coordinates");
            }
            await this.runCommandAfterSelecting([
                "click_xy",
                String(targetOrX),
                String(y),
            ]);
            return;
        }
        const target = typeof targetOrX === "string"
            ? { kind: "selector", value: targetOrX }
            : targetOrX;
        switch (target.kind) {
            case "selector":
                await this.runCommandAfterSelecting(["click", target.value]);
                return;
            case "snapshot_ref":
                await this.runCommandAfterSelecting([
                    "click",
                    this.refSelector(target.value),
                ]);
                return;
            case "coords":
                await this.runCommandAfterSelecting([
                    "click_xy",
                    String(target.x),
                    String(target.y),
                ]);
                return;
            default:
                throw new Error(`browse_cli does not support click target kind "${target.kind}" yet`);
        }
    }
    async hover(targetOrX, y) {
        if (typeof targetOrX === "number") {
            if (typeof y !== "number") {
                throw new Error("hover(x, y) requires both numeric coordinates");
            }
            await this.runCommandAfterSelecting([
                "hover",
                String(targetOrX),
                String(y),
            ]);
            return;
        }
        const target = typeof targetOrX === "string"
            ? { kind: "selector", value: targetOrX }
            : targetOrX;
        switch (target.kind) {
            case "selector": {
                const point = await this.resolveHoverPoint(target.value);
                await this.runCommandAfterSelecting([
                    "hover",
                    String(point.x),
                    String(point.y),
                ]);
                return;
            }
            case "coords":
                await this.runCommandAfterSelecting([
                    "hover",
                    String(target.x),
                    String(target.y),
                ]);
                return;
            default:
                throw new Error(`browse_cli does not support hover target kind "${target.kind}" yet`);
        }
    }
    async scroll(x, y, deltaX, deltaY) {
        await this.runCommandAfterSelecting([
            "scroll",
            String(x),
            String(y),
            String(deltaX),
            String(deltaY),
        ]);
    }
    async type(targetOrText, text) {
        if (typeof targetOrText === "string" && typeof text === "undefined") {
            await this.runCommandAfterSelecting(["type", targetOrText]);
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
                await this.runCommandAfterSelecting(["type", text]);
                return;
            case "selector":
                await this.runCommandAfterSelecting([
                    "fill",
                    target.value,
                    text,
                    "--no-press-enter",
                ]);
                return;
            default:
                throw new Error(`browse_cli does not support type target kind "${target.kind}" yet`);
        }
    }
    async press(targetOrKey, key) {
        if (typeof targetOrKey === "string" && typeof key === "undefined") {
            await this.runCommandAfterSelecting(["press", targetOrKey]);
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
                await this.runCommandAfterSelecting(["press", key]);
                return;
            case "selector":
                await this.runCommandAfterSelecting(["click", target.value]);
                await this.runCommandAfterSelecting(["press", key]);
                return;
            case "snapshot_ref":
                await this.runCommandAfterSelecting([
                    "click",
                    this.refSelector(target.value),
                ]);
                await this.runCommandAfterSelecting(["press", key]);
                return;
            case "coords":
                await this.runCommandAfterSelecting([
                    "click_xy",
                    String(target.x),
                    String(target.y),
                ]);
                await this.runCommandAfterSelecting(["press", key]);
                return;
            default:
                throw new Error(`browse_cli does not support press target kind "${target.kind}" yet`);
        }
    }
    async represent() {
        // BROWSE_SNAPSHOT_FULL=1 includes the ref maps in the snapshot.
        const full = process.env.BROWSE_SNAPSHOT_FULL === "1";
        const snapshot = await this.runCommandAfterSelecting(full ? ["snapshot", "--full"] : ["snapshot"]);
        const content = snapshot.tree;
        return {
            kind: "snapshot_refs",
            content,
            metadata: {
                bytes: Buffer.byteLength(content, "utf8"),
                tokenEstimate: Math.ceil(content.length / 4),
                // Count refs from xpathMap when present, else from the tree.
                refCount: snapshot.xpathMap
                    ? Object.keys(snapshot.xpathMap).length
                    : (content.match(/\[\d+-\d+\]/g)?.length ?? 0),
            },
            raw: snapshot,
        };
    }
}
class BrowseCliSession {
    sessionName;
    runtime;
    handles = new Map();
    activePageId = null;
    closed = false;
    constructor(sessionName) {
        this.sessionName = sessionName;
        this.runtime = new BrowseCliRuntime(sessionName);
    }
    wrap(page) {
        const existing = this.handles.get(page.targetId);
        if (existing) {
            existing.setCachedUrl(page.url);
            return existing;
        }
        const handle = new BrowseCliPageHandle(this, page.targetId, page.url);
        this.handles.set(page.targetId, handle);
        return handle;
    }
    async fetchPages() {
        const result = await this.runtime.runJson(["pages"]);
        const pages = result.pages ?? [];
        for (const page of pages) {
            this.wrap(page);
        }
        if (this.activePageId &&
            !pages.some((page) => page.targetId === this.activePageId)) {
            this.activePageId = null;
        }
        if (!this.activePageId && pages.length > 0) {
            this.activePageId = pages[0].targetId;
        }
        return pages;
    }
    async selectIfNeeded(pageId) {
        if (this.activePageId === pageId)
            return;
        await this.selectPage(pageId);
    }
    async listPages() {
        const pages = await this.fetchPages();
        return pages.map((page) => this.wrap(page));
    }
    async activePage() {
        const pages = await this.fetchPages();
        if (this.activePageId) {
            const active = pages.find((page) => page.targetId === this.activePageId);
            if (active)
                return this.wrap(active);
        }
        if (pages.length === 0) {
            throw new Error("No active page available");
        }
        this.activePageId = pages[0].targetId;
        return this.wrap(pages[0]);
    }
    async newPage(url) {
        const args = ["newpage"];
        if (url) {
            args.push(url);
        }
        const result = await this.runtime.runJson(args);
        this.activePageId = result.targetId;
        await this.fetchPages();
        return this.wrap(result);
    }
    async selectPage(pageId) {
        const pages = await this.fetchPages();
        const page = pages.find((candidate) => candidate.targetId === pageId);
        if (!page) {
            throw new Error(`Unknown page id "${pageId}"`);
        }
        await this.runtime.runJson(["tab_switch", String(page.index)]);
        this.activePageId = pageId;
    }
    async closePage(pageId) {
        const pages = await this.fetchPages();
        const page = pages.find((candidate) => candidate.targetId === pageId);
        if (!page) {
            throw new Error(`Unknown page id "${pageId}"`);
        }
        await this.runtime.runJson(["tab_close", String(page.index)]);
        this.handles.delete(pageId);
        const remaining = await this.fetchPages();
        this.activePageId = remaining[0]?.targetId ?? null;
    }
    async close() {
        if (this.closed)
            return;
        this.closed = true;
        try {
            await this.runtime.runJson(["stop", "--force"]);
        }
        catch {
            // best-effort only
        }
    }
    async getArtifacts() {
        return [];
    }
    async getRawMetrics() {
        return {
            sessionName: this.sessionName,
        };
    }
}
function connectionModeFromProfile(startupProfile) {
    if (startupProfile === "tool_launch_local") {
        return "launch";
    }
    if (startupProfile === "tool_create_browserbase") {
        return "browserbase_native";
    }
    return "launch";
}
function createSessionName() {
    return `evals-browse-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
export class BrowseCliTool {
    id = "browse_cli";
    surface = "cli";
    family = "stagehand_cli";
    supportedStartupProfiles = [
        "tool_launch_local",
        "tool_create_browserbase",
    ];
    supportedCapabilities = [
        ...SUPPORTED_CAPABILITIES,
    ];
    supportedTargetKinds = [
        "selector",
        "coords",
        "focused",
        "snapshot_ref",
    ];
    async start(input) {
        if (input.startupProfile !== "tool_launch_local" &&
            input.startupProfile !== "tool_create_browserbase") {
            throw new Error(`browse_cli does not support startup profile "${input.startupProfile}" yet`);
        }
        if ((input.environment === "LOCAL" &&
            input.startupProfile !== "tool_launch_local") ||
            (input.environment === "BROWSERBASE" &&
                input.startupProfile !== "tool_create_browserbase")) {
            throw new Error(`browse_cli startup profile "${input.startupProfile}" is not valid for environment "${input.environment}"`);
        }
        const session = new BrowseCliSession(createSessionName());
        await session.runtime.runJson([
            "env",
            input.environment === "BROWSERBASE" ? "remote" : "local",
        ]);
        return {
            session,
            cleanup: async () => {
                await session.close();
            },
            metadata: {
                environment: input.environment === "BROWSERBASE" ? "browserbase" : "local",
                browserOwnership: "tool",
                connectionMode: connectionModeFromProfile(input.startupProfile),
                startupProfile: input.startupProfile,
            },
        };
    }
}
