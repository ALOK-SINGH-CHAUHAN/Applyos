import { Stagehand } from "@browserbasehq/stagehand";
import { type RefMaps } from "./commands/selectors.js";
import type { DriverCommandName } from "./commands/types.js";
import { type ForwardedEnv } from "./daemon/forwarded-env.js";
import { NetworkCapture } from "./network-capture.js";
import type { ConnectionTarget, DriverStatus, OpenResult, PageSummary } from "./types.js";
export type DriverContext = Stagehand["context"];
export type DriverPage = Awaited<ReturnType<DriverContext["awaitActivePage"]>>;
/**
 * Exponential backoff for cached init failures: 5s, 10s, 20s, ... capped at
 * 1 minute. Prevents agents stuck in retry loops from hammering init while
 * still allowing a quick retry after the first failure.
 */
export declare function initFailureBackoffMs(consecutiveFailures: number): number;
export declare function isChromeNotFoundError(error: unknown): boolean;
export declare class DriverSessionManager {
    private readonly session;
    private readonly target;
    readonly network: NetworkCapture;
    private consecutiveInitFailures;
    private context;
    private lastForwardedEnvSignature;
    private pendingEnv;
    private initFailure;
    private initPromise;
    private refMaps;
    private selectedTargetId;
    private stagehand;
    constructor(session: string, target: ConnectionTarget);
    open(url: string): Promise<OpenResult>;
    execute(command: DriverCommandName, params?: unknown): Promise<unknown>;
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
    applyForwardedEnv(forwardedEnv: ForwardedEnv | undefined): void;
    activePage(): Promise<DriverPage>;
    pageForOpen(): Promise<DriverPage>;
    browserContext(): Promise<DriverContext>;
    stagehandInstance(): Promise<Stagehand>;
    status(): Promise<DriverStatus>;
    /**
     * Browserbase session identity (id, dashboard URL, live-view/debug URL) for a
     * live remote session. Lets `status`/`open`/`doctor` reason about the cloud
     * session instead of losing it the way a raw `--cdp` attach does. Empty for
     * non-remote targets or before the driver has initialized.
     */
    private browserbaseIdentity;
    close(): Promise<void>;
    resolveSelector(selector: string): string;
    setRefMaps(refMaps: RefMaps): void;
    openResult(page: DriverPage): Promise<OpenResult>;
    pageSummaries(): Promise<PageSummary[]>;
    safeTitle(page: DriverPage): Promise<string>;
    private ensurePage;
    private activePageIfPresent;
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
    private activateIfNeeded;
    private ensureInitialized;
    private markRepeatedInitFailure;
    private initialize;
    private resolveTarget;
    private stagehandOptions;
}
