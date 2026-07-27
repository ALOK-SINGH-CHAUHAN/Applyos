import { Stagehand } from "@browserbasehq/stagehand";
import { emptyRefMaps, resolveSelector as resolveCachedSelector, } from "./commands/selectors.js";
import { executeDriverCommand } from "./commands/registry.js";
import { forwardedEnvSignature, } from "./daemon/forwarded-env.js";
import { DriverError } from "./errors.js";
import { discoverLocalCdp } from "./local-cdp-discovery.js";
import { NetworkCapture } from "./network-capture.js";
import { getRemote } from "./remote-binding.js";
const INIT_FAILURE_RETRY_MS = 5_000;
const INIT_FAILURE_RETRY_MAX_MS = 60_000;
// chrome-launcher reports "no Chrome on this machine" with these codes (its
// LaunchErrorCodes const enum, which can't be imported directly: const enums
// are erased at build time and isolatedModules forbids cross-module access).
const CHROME_NOT_FOUND_ERROR_CODES = new Set([
    "ERR_LAUNCHER_NOT_INSTALLED",
    "ERR_LAUNCHER_PATH_NOT_SET",
]);
/**
 * Exponential backoff for cached init failures: 5s, 10s, 20s, ... capped at
 * 1 minute. Prevents agents stuck in retry loops from hammering init while
 * still allowing a quick retry after the first failure.
 */
export function initFailureBackoffMs(consecutiveFailures) {
    const attempt = Math.max(1, consecutiveFailures);
    return Math.min(INIT_FAILURE_RETRY_MS * 2 ** (attempt - 1), INIT_FAILURE_RETRY_MAX_MS);
}
export function isChromeNotFoundError(error) {
    const code = error?.code;
    if (typeof code === "string" && CHROME_NOT_FOUND_ERROR_CODES.has(code)) {
        return true;
    }
    return (error instanceof Error &&
        error.message.includes("No Chrome installations found"));
}
export class DriverSessionManager {
    session;
    target;
    network;
    consecutiveInitFailures = 0;
    context = null;
    lastForwardedEnvSignature = null;
    pendingEnv;
    initFailure = null;
    initPromise = null;
    refMaps = emptyRefMaps();
    selectedTargetId;
    stagehand = null;
    constructor(session, target) {
        this.session = session;
        this.target = target;
        this.network = new NetworkCapture(session);
    }
    async open(url) {
        return (await this.execute("open", { url }));
    }
    async execute(command, params) {
        return executeDriverCommand(this, command, params);
    }
    /**
     * Apply env vars forwarded by the client (e.g. an inline or exported API
     * key set after the daemon started). Honoring a late key without a manual
     * restart is the whole point of forwarding.
     *
     * The forwarded env is stashed for the next `init()`, which threads it
     * straight into the Stagehand constructor — never into `process.env` — so the
     * key's only home is the live session. A live, already-initialized session
     * keeps its existing browser (forwarded env only matters at init), so the
     * warm-daemon fast path is untouched. When the forwarded env changes *before*
     * a successful init (the common case: a first key-less `open` failed, then a
     * key is supplied), clear the cached init failure and backoff so the retry
     * runs immediately with the new key instead of replaying the stale
     * missing-key error.
     */
    applyForwardedEnv(forwardedEnv) {
        // Keep the caller's latest forwarded env available to the next init.
        this.pendingEnv = forwardedEnv;
        const signature = forwardedEnvSignature(forwardedEnv);
        if (signature === this.lastForwardedEnvSignature)
            return;
        this.lastForwardedEnvSignature = signature;
        if (this.stagehand && this.context)
            return;
        this.initFailure = null;
        this.consecutiveInitFailures = 0;
    }
    async activePage() {
        return this.ensurePage();
    }
    async pageForOpen() {
        return this.ensurePage({ createIfMissing: true });
    }
    async browserContext() {
        await this.ensureInitialized();
        if (!this.context) {
            throw new Error("Driver context failed to initialize.");
        }
        return this.context;
    }
    async stagehandInstance() {
        await this.ensureInitialized();
        if (!this.stagehand) {
            throw new Error("Stagehand instance failed to initialize.");
        }
        return this.stagehand;
    }
    async status() {
        if (!this.stagehand || !this.context) {
            return {
                browserConnected: false,
                initialized: false,
                mode: this.target.kind,
                pages: [],
                pid: process.pid,
                selectedTargetId: this.selectedTargetId,
                session: this.session,
                target: this.target,
            };
        }
        const page = this.activePageIfPresent();
        const pages = await this.pageSummaries();
        return {
            ...this.browserbaseIdentity(),
            browserConnected: true,
            initialized: true,
            mode: this.target.kind,
            pages,
            pid: process.pid,
            selectedTargetId: page?.targetId() ?? this.selectedTargetId,
            session: this.session,
            target: this.target,
            title: page ? await safeTitle(page) : undefined,
            url: page?.url(),
        };
    }
    /**
     * Browserbase session identity (id, dashboard URL, live-view/debug URL) for a
     * live remote session. Lets `status`/`open`/`doctor` reason about the cloud
     * session instead of losing it the way a raw `--cdp` attach does. Empty for
     * non-remote targets or before the driver has initialized.
     */
    browserbaseIdentity() {
        if (this.target.kind !== "remote" || !this.stagehand)
            return {};
        const { browserbaseSessionID, browserbaseSessionURL, browserbaseDebugURL } = this.stagehand;
        const identity = {};
        if (browserbaseSessionID) {
            identity.browserbaseSessionId = browserbaseSessionID;
        }
        if (browserbaseSessionURL) {
            identity.browserbaseSessionUrl = browserbaseSessionURL;
        }
        if (browserbaseDebugURL) {
            identity.browserbaseDebugUrl = browserbaseDebugURL;
        }
        return identity;
    }
    async close() {
        const stagehand = this.stagehand;
        this.stagehand = null;
        this.context = null;
        this.initFailure = null;
        this.consecutiveInitFailures = 0;
        await this.network.disable().catch(() => undefined);
        if (stagehand) {
            await stagehand.close().catch(() => undefined);
        }
    }
    resolveSelector(selector) {
        return resolveCachedSelector(selector, this.refMaps);
    }
    setRefMaps(refMaps) {
        this.refMaps = refMaps;
    }
    async openResult(page) {
        return {
            ...this.browserbaseIdentity(),
            mode: this.target.kind,
            pages: await this.pageSummaries(),
            selectedTargetId: page.targetId(),
            session: this.session,
            title: await this.safeTitle(page),
            url: page.url(),
        };
    }
    async pageSummaries() {
        const pages = this.context?.pages() ?? [];
        return Promise.all(pages.map(async (page, index) => ({
            index,
            targetId: page.targetId(),
            title: await this.safeTitle(page),
            url: page.url(),
        })));
    }
    async safeTitle(page) {
        return safeTitle(page);
    }
    async ensurePage(options = {}) {
        await this.ensureInitialized();
        if (!this.context) {
            throw new Error("Driver context failed to initialize.");
        }
        const target = this.target;
        if (target.kind === "cdp" && target.targetId) {
            const page = this.context
                .pages()
                .find((candidate) => candidate.targetId() === target.targetId);
            if (!page) {
                throw new Error(`Target ${target.targetId} was not found in the attached browser.`);
            }
            this.activateIfNeeded(page);
            this.selectedTargetId = page.targetId();
            return page;
        }
        const existingPage = this.activePageIfPresent() ?? this.context.pages()[0];
        if (existingPage) {
            this.activateIfNeeded(existingPage);
            this.selectedTargetId = existingPage.targetId();
            return existingPage;
        }
        if (options.createIfMissing) {
            const page = await this.context.newPage();
            this.activateIfNeeded(page);
            this.selectedTargetId = page.targetId();
            return page;
        }
        throw new DriverError(`No active page in session "${this.session}". Run browse open <url> --session ${this.session} or browse tab new <url> --session ${this.session}.`, { code: "no_active_page" });
    }
    activePageIfPresent() {
        try {
            return this.context?.activePage() ?? undefined;
        }
        catch {
            return undefined;
        }
    }
    /**
     * Mark `page` active only when it isn't already the active page.
     *
     * `setActivePage` ends in a CDP `Target.activateTarget`, which on macOS
     * raises the whole Chrome app to the OS foreground and steals keyboard focus.
     * The daemon resolves the active page on every subcommand, so calling this
     * unconditionally yanks focus away from the user's editor/terminal on each
     * command in headed local mode. Skipping the redundant re-activation keeps a
     * headed session usable alongside a coding agent.
     */
    activateIfNeeded(page) {
        if (page !== this.activePageIfPresent()) {
            this.context?.setActivePage(page);
        }
    }
    async ensureInitialized() {
        if (this.stagehand && this.context)
            return;
        if (this.initPromise)
            return this.initPromise;
        if (this.initFailure) {
            if (Date.now() < this.initFailure.retryAt) {
                throw this.initFailure.error;
            }
            this.initFailure = null;
        }
        this.initPromise = this.initialize()
            .then(() => {
            this.initFailure = null;
            this.consecutiveInitFailures = 0;
        })
            .catch(async (error) => {
            this.consecutiveInitFailures += 1;
            const failure = await this.markRepeatedInitFailure(error);
            this.initFailure = {
                error: failure,
                retryAt: Date.now() + initFailureBackoffMs(this.consecutiveInitFailures),
            };
            throw failure;
        })
            .finally(() => {
            this.initPromise = null;
        });
        return this.initPromise;
    }
    async markRepeatedInitFailure(error) {
        if (this.consecutiveInitFailures < 3 || !(error instanceof Error)) {
            return error;
        }
        const hint = (await getRemote()).driverInitHints().repeatedInitFailure;
        if (!error.message.includes(hint)) {
            error.message += hint;
        }
        return error;
    }
    async initialize() {
        const resolvedTarget = await this.resolveTarget();
        const options = await this.stagehandOptions(resolvedTarget);
        const stagehand = new Stagehand(options);
        try {
            await stagehand.init();
        }
        catch (error) {
            await stagehand.close().catch(() => undefined);
            throw await describeInitError(error, resolvedTarget);
        }
        this.stagehand = stagehand;
        this.context = stagehand.context;
    }
    async resolveTarget() {
        if (this.target.kind !== "auto-connect")
            return this.target;
        const discovered = await discoverLocalCdp();
        if (!discovered) {
            throw new Error("No debuggable local browser found. Start Chrome with --remote-debugging-port=9222 or pass --cdp <url|port>.");
        }
        return { kind: "cdp", endpoint: discovered.wsUrl };
    }
    async stagehandOptions(target) {
        if (target.kind === "remote") {
            return await (await getRemote()).remoteStagehandOptions(target, this.pendingEnv);
        }
        if (target.kind === "managed-local") {
            return {
                disablePino: true,
                env: "LOCAL",
                localBrowserLaunchOptions: {
                    ...(target.chromeArgs?.length ? { args: target.chromeArgs } : {}),
                    ...(target.ignoreDefaultArgs !== undefined
                        ? { ignoreDefaultArgs: target.ignoreDefaultArgs }
                        : {}),
                    headless: target.headless,
                },
                verbose: 0,
            };
        }
        if (target.kind === "cdp") {
            return {
                disablePino: true,
                env: "LOCAL",
                localBrowserLaunchOptions: {
                    cdpUrl: target.endpoint,
                },
                verbose: 0,
            };
        }
        throw new Error(`Unsupported target kind: ${target.kind}`);
    }
}
async function safeTitle(page) {
    try {
        return await page.title();
    }
    catch {
        return "";
    }
}
/**
 * Turn raw `stagehand.init()` failures into typed, actionable errors. Remote
 * failures are classified by the remote capability (401/403/etc.); a missing
 * local Chrome gets install/escape-hatch guidance. Anything else is rethrown
 * unchanged.
 */
async function describeInitError(error, target) {
    if (error instanceof DriverError)
        return error;
    if (target.kind === "remote") {
        const { code, httpStatus, message } = (await getRemote()).classifyRemoteInitError(error);
        return new DriverError(message, { cause: error, code, httpStatus });
    }
    if (target.kind === "managed-local" && isChromeNotFoundError(error)) {
        return new DriverError((await getRemote()).driverInitHints().chromeNotFound, {
            cause: error,
            code: "no_chrome_found",
        });
    }
    return error;
}
