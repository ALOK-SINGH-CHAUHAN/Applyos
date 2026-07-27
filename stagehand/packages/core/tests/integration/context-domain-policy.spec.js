import { test, expect } from "@playwright/test";
import { createServer } from "node:http";
import { V3 } from "../../lib/v3/v3.js";
import { v3TestConfig } from "./v3.config.js";
import { closeV3 } from "./testUtils.js";
const BLOCKED_HOST = "example.com";
const BLOCKED_URL = `https://${BLOCKED_HOST}/stagehand-domain-policy.png`;
const POPUP_FIXTURE_URL = "https://browserbase.github.io/stagehand-eval-sites/sites/external-popup-button/";
const POPUP_BLOCKED_HOST = "news.ycombinator.com";
const POPUP_BLOCKED_URL = `https://${POPUP_BLOCKED_HOST}/`;
const ALLOWED_HOST = "127.0.0.1";
const DISALLOWED_HOST = "127.0.0.2";
let localServer = null;
let localServerPort = 0;
function pageWithBlockedImage() {
    return pageWithImages([BLOCKED_URL]);
}
function pageWithImages(urls) {
    return `data:text/html,${encodeURIComponent(`<html><body>${urls.map((url) => `<img src="${url}" />`).join("")}</body></html>`)}`;
}
function localUrl(hostname, path) {
    return `http://${hostname}:${localServerPort}${path}`;
}
async function waitForBlockedRequest(page) {
    const outcomes = await waitForRequestOutcomes(page, pageWithBlockedImage(), [
        BLOCKED_URL,
    ]);
    expectBlockedByClient(outcomes.get(BLOCKED_URL));
}
async function waitForRequestOutcomes(page, pageUrl, expectedUrls) {
    await page.mainSession.send("Network.enable");
    return await new Promise((resolve, reject) => {
        const requestUrls = new Map();
        const expected = new Set(expectedUrls);
        const outcomes = new Map();
        let settled = false;
        const timeout = setTimeout(() => {
            finish(() => reject(new Error(`Timed out waiting for request outcomes: ${Array.from(expected).join(", ")}`)));
        }, 5000);
        const cleanup = () => {
            clearTimeout(timeout);
            page.mainSession.off("Network.requestWillBeSent", onRequest);
            page.mainSession.off("Network.loadingFinished", onLoadingFinished);
            page.mainSession.off("Network.loadingFailed", onLoadingFailed);
        };
        const finish = (settle) => {
            if (settled)
                return;
            settled = true;
            cleanup();
            settle();
        };
        const recordOutcome = (url, outcome) => {
            if (!expected.has(url) || outcomes.has(url))
                return;
            outcomes.set(url, outcome);
            if (outcomes.size === expected.size) {
                finish(() => resolve(outcomes));
            }
        };
        const onRequest = (params) => {
            const evt = params;
            requestUrls.set(evt.requestId, String(evt.request?.url ?? ""));
        };
        const onLoadingFinished = (params) => {
            const evt = params;
            const url = requestUrls.get(evt.requestId);
            if (!url)
                return;
            recordOutcome(url, { type: "finished" });
        };
        const onLoadingFailed = (params) => {
            const evt = params;
            const url = requestUrls.get(evt.requestId);
            if (!url)
                return;
            recordOutcome(url, { type: "failed", errorText: evt.errorText });
        };
        page.mainSession.on("Network.requestWillBeSent", onRequest);
        page.mainSession.on("Network.loadingFinished", onLoadingFinished);
        page.mainSession.on("Network.loadingFailed", onLoadingFailed);
        void page
            .goto(pageUrl, {
            waitUntil: "load",
            timeoutMs: 5000,
        })
            .catch((error) => {
            finish(() => reject(error));
        });
    });
}
function expectBlockedByClient(outcome) {
    expect(outcome?.type).toBe("failed");
    expect(outcome?.errorText).toContain("ERR_BLOCKED_BY_CLIENT");
}
function expectNotBlockedByClient(outcome) {
    expect(outcome).toBeTruthy();
    if (outcome?.type === "failed") {
        expect(outcome.errorText).not.toContain("ERR_BLOCKED_BY_CLIENT");
    }
}
async function waitForTargetUrlDestroyed(conn, expectedUrl, timeoutMs = 5_000) {
    await new Promise((resolve, reject) => {
        let targetId = null;
        let settled = false;
        const timeout = setTimeout(() => {
            finish(() => reject(new Error(`Timed out waiting for target URL to close: ${expectedUrl}`)));
        }, timeoutMs);
        const cleanup = () => {
            clearTimeout(timeout);
            conn.off("Target.targetCreated", onTargetCreated);
            conn.off("Target.targetInfoChanged", onTargetInfoChanged);
            conn.off("Target.targetDestroyed", onTargetDestroyed);
        };
        const finish = (settle) => {
            if (settled)
                return;
            settled = true;
            cleanup();
            settle();
        };
        const rememberTarget = (targetInfo) => {
            if (targetInfo.url === expectedUrl) {
                targetId = targetInfo.targetId;
            }
        };
        const onTargetCreated = (params) => {
            const evt = params;
            rememberTarget(evt.targetInfo);
        };
        const onTargetInfoChanged = (params) => {
            const evt = params;
            rememberTarget(evt.targetInfo);
        };
        const onTargetDestroyed = (params) => {
            const evt = params;
            if (targetId && evt.targetId === targetId) {
                finish(resolve);
            }
        };
        conn.on("Target.targetCreated", onTargetCreated);
        conn.on("Target.targetInfoChanged", onTargetInfoChanged);
        conn.on("Target.targetDestroyed", onTargetDestroyed);
    });
}
test.describe("context.setDomainPolicy", () => {
    let v3;
    test.beforeAll(async () => {
        localServer = createServer((_, res) => {
            res.writeHead(200, {
                "content-type": "image/svg+xml",
                "cache-control": "no-store",
            });
            res.end(`<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>`);
        });
        await new Promise((resolve) => {
            localServer?.listen(0, ALLOWED_HOST, () => {
                localServerPort = (localServer?.address()).port;
                resolve();
            });
        });
    });
    test.afterAll(async () => {
        await new Promise((resolve, reject) => {
            if (!localServer) {
                resolve();
                return;
            }
            localServer.close((error) => {
                if (error)
                    reject(error);
                else
                    resolve();
            });
        });
        localServer = null;
        localServerPort = 0;
    });
    test.beforeEach(async () => {
        v3 = new V3(v3TestConfig);
        await v3.init();
    });
    test.afterEach(async () => {
        await closeV3(v3);
    });
    test("blocks matching requests on existing pages", async () => {
        const ctx = v3.context;
        const page = (await ctx.awaitActivePage());
        await ctx.setDomainPolicy({
            blockedDomains: [BLOCKED_HOST],
        });
        await waitForBlockedRequest(page);
    });
    test("applies to pages created after setting the policy", async () => {
        const ctx = v3.context;
        await ctx.setDomainPolicy({
            blockedDomains: [BLOCKED_HOST],
        });
        const page = (await ctx.newPage());
        await waitForBlockedRequest(page);
    });
    test("allows matching requests and blocks non-matching requests", async () => {
        const ctx = v3.context;
        const page = (await ctx.awaitActivePage());
        const allowedUrl = localUrl(ALLOWED_HOST, "/allowed.png");
        const disallowedUrl = localUrl(DISALLOWED_HOST, "/disallowed.png");
        await ctx.setDomainPolicy({
            allowedDomains: [ALLOWED_HOST],
        });
        const outcomes = await waitForRequestOutcomes(page, pageWithImages([allowedUrl, disallowedUrl]), [allowedUrl, disallowedUrl]);
        expectNotBlockedByClient(outcomes.get(allowedUrl));
        expectBlockedByClient(outcomes.get(disallowedUrl));
    });
    test("blocked domains take precedence over allowed domains", async () => {
        const ctx = v3.context;
        const page = (await ctx.awaitActivePage());
        await ctx.setDomainPolicy({
            allowedDomains: [ALLOWED_HOST],
            blockedDomains: [ALLOWED_HOST],
        });
        const blockedUrl = localUrl(ALLOWED_HOST, "/blocked-by-precedence.png");
        const outcomes = await waitForRequestOutcomes(page, pageWithImages([blockedUrl]), [blockedUrl]);
        expectBlockedByClient(outcomes.get(blockedUrl));
    });
    test("allowed domains apply to pages created after setting the policy", async () => {
        const ctx = v3.context;
        const disallowedUrl = localUrl(DISALLOWED_HOST, "/new-page-disallowed.png");
        await ctx.setDomainPolicy({
            allowedDomains: [ALLOWED_HOST],
        });
        const page = (await ctx.newPage());
        const outcomes = await waitForRequestOutcomes(page, pageWithImages([disallowedUrl]), [disallowedUrl]);
        expectBlockedByClient(outcomes.get(disallowedUrl));
    });
    test("closes window.open popups that reach blocked domains before interception", async () => {
        const ctx = v3.context;
        const page = (await ctx.awaitActivePage());
        await ctx.setDomainPolicy({
            blockedDomains: [POPUP_BLOCKED_HOST],
        });
        await page.goto(POPUP_FIXTURE_URL, {
            waitUntil: "load",
            timeoutMs: 10_000,
        });
        const popupClosed = waitForTargetUrlDestroyed(ctx.conn, POPUP_BLOCKED_URL);
        await page.locator("#open-popup").click();
        await popupClosed;
        await expect
            .poll(() => ctx.pages().map((candidate) => candidate.url()), {
            timeout: 5_000,
        })
            .not.toContain(POPUP_BLOCKED_URL);
        expect(ctx.pages().map((candidate) => candidate.url())).not.toContain(POPUP_BLOCKED_URL);
        expect(page.url()).toBe(POPUP_FIXTURE_URL);
    });
});
