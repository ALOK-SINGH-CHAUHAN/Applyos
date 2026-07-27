import { promises as fs } from "node:fs";
import path from "node:path";
import { ensurePrivateDir, ensureRuntimeDir, getNetworkDir, writePrivateFile, } from "./daemon/paths.js";
export class NetworkCapture {
    session;
    cdpSession = null;
    counter = 0;
    enabled = false;
    pendingRequests = new Map();
    requestDirs = new Map();
    requestStartTimes = new Map();
    responseMetadata = new Map();
    listeners = [];
    networkDir = null;
    constructor(session) {
        this.session = session;
    }
    async enable(page) {
        if (this.enabled && this.networkDir) {
            return { alreadyEnabled: true, enabled: true, path: this.networkDir };
        }
        await ensureRuntimeDir();
        this.networkDir = getNetworkDir(this.session);
        await ensurePrivateDir(this.networkDir);
        this.counter = 0;
        this.pendingRequests.clear();
        this.requestDirs.clear();
        this.requestStartTimes.clear();
        this.responseMetadata.clear();
        const cdpSession = page.mainFrame().session;
        this.cdpSession = cdpSession;
        await cdpSession.send("Network.enable", {
            maxResourceBufferSize: 5_000_000,
            maxTotalBufferSize: 10_000_000,
        });
        this.addListener("Network.requestWillBeSent", (params) => {
            void this.handleRequestWillBeSent(params);
        });
        this.addListener("Network.responseReceived", (params) => {
            this.handleResponseReceived(params);
        });
        this.addListener("Network.loadingFinished", (params) => {
            void this.handleLoadingFinished(params);
        });
        this.addListener("Network.loadingFailed", (params) => {
            void this.handleLoadingFailed(params);
        });
        this.enabled = true;
        return { enabled: true, path: this.networkDir };
    }
    async disable() {
        if (!this.enabled) {
            return { alreadyDisabled: true, enabled: false, path: this.networkDir };
        }
        for (const [event, listener] of this.listeners) {
            this.cdpSession?.off?.(event, listener);
        }
        this.listeners.length = 0;
        await this.cdpSession?.send("Network.disable").catch(() => undefined);
        this.cdpSession = null;
        this.enabled = false;
        return { enabled: false, path: this.networkDir };
    }
    path() {
        return {
            enabled: this.enabled,
            path: this.networkDir ?? getNetworkDir(this.session),
        };
    }
    async clear() {
        const dir = this.networkDir ?? getNetworkDir(this.session);
        try {
            await ensurePrivateDir(dir);
            const entries = await fs.readdir(dir, { withFileTypes: true });
            await Promise.all(entries
                .filter((entry) => entry.isDirectory())
                .map((entry) => fs.rm(path.join(dir, entry.name), { recursive: true })));
            this.counter = 0;
            this.pendingRequests.clear();
            this.requestDirs.clear();
            this.requestStartTimes.clear();
            this.responseMetadata.clear();
            return { cleared: true, path: dir };
        }
        catch (error) {
            return {
                cleared: false,
                error: error instanceof Error ? error.message : String(error),
                path: dir,
            };
        }
    }
    addListener(event, listener) {
        this.cdpSession?.on(event, listener);
        this.listeners.push([event, listener]);
    }
    handleRequestWillBeSent(params) {
        if (!this.enabled || !this.networkDir)
            return;
        const event = params;
        if (!event.requestId || !event.request?.url)
            return;
        const request = {
            body: event.request.postData ?? null,
            headers: event.request.headers ?? {},
            id: event.requestId,
            method: event.request.method ?? "GET",
            resourceType: event.type ?? "Other",
            timestamp: new Date().toISOString(),
            url: event.request.url,
        };
        this.pendingRequests.set(event.requestId, request);
        this.requestStartTimes.set(event.requestId, Date.now());
        const requestDir = this.writeRequest(request).catch(() => null);
        this.requestDirs.set(event.requestId, requestDir);
    }
    handleResponseReceived(params) {
        const event = params;
        if (!event.requestId || !event.response)
            return;
        this.responseMetadata.set(event.requestId, {
            headers: event.response.headers ?? {},
            mimeType: event.response.mimeType ?? "",
            status: event.response.status ?? 0,
            statusText: event.response.statusText ?? "",
        });
    }
    async handleLoadingFinished(params) {
        if (!this.enabled)
            return;
        const event = params;
        if (!event.requestId)
            return;
        const requestDir = await this.requestDirs.get(event.requestId);
        if (!requestDir) {
            this.forget(event.requestId);
            return;
        }
        const metadata = this.responseMetadata.get(event.requestId);
        const started = this.requestStartTimes.get(event.requestId) ?? Date.now();
        let body;
        try {
            const result = await this.cdpSession?.send("Network.getResponseBody", {
                requestId: event.requestId,
            });
            body = result?.body ?? null;
            if (result?.base64Encoded && body) {
                body = `[base64] ${body.slice(0, 100)}...`;
            }
        }
        catch {
            body = null;
        }
        await this.writeResponse(requestDir, {
            body,
            duration: Date.now() - started,
            headers: metadata?.headers ?? {},
            id: event.requestId,
            mimeType: metadata?.mimeType ?? "",
            status: metadata?.status ?? 0,
            statusText: metadata?.statusText ?? "",
        });
        this.forget(event.requestId);
    }
    async handleLoadingFailed(params) {
        const event = params;
        if (!event.requestId)
            return;
        const requestDir = await this.requestDirs.get(event.requestId);
        if (!requestDir) {
            this.forget(event.requestId);
            return;
        }
        const started = this.requestStartTimes.get(event.requestId) ?? Date.now();
        await this.writeResponse(requestDir, {
            body: null,
            duration: Date.now() - started,
            error: event.errorText ?? "Unknown error",
            headers: {},
            id: event.requestId,
            mimeType: "",
            status: 0,
            statusText: "Failed",
        });
        this.forget(event.requestId);
    }
    async writeRequest(request) {
        if (!this.networkDir)
            return null;
        const requestDir = path.join(this.networkDir, getRequestDirName(this.counter++, request.method, request.url));
        await ensurePrivateDir(requestDir);
        await writePrivateFile(path.join(requestDir, "request.json"), JSON.stringify(request, null, 2));
        return requestDir;
    }
    async writeResponse(requestDir, response) {
        await writePrivateFile(path.join(requestDir, "response.json"), JSON.stringify(response, null, 2)).catch(() => undefined);
    }
    forget(requestId) {
        this.pendingRequests.delete(requestId);
        this.requestDirs.delete(requestId);
        this.requestStartTimes.delete(requestId);
        this.responseMetadata.delete(requestId);
    }
}
function getRequestDirName(counter, method, url) {
    try {
        const parsed = new URL(url);
        const domain = sanitizeForFilename(parsed.hostname, 30);
        const pathPart = sanitizeForFilename(parsed.pathname.split("/").filter(Boolean)[0] || "root", 20);
        return `${String(counter).padStart(3, "0")}-${method}-${domain}-${pathPart}`;
    }
    catch {
        return `${String(counter).padStart(3, "0")}-${method}-unknown`;
    }
}
function sanitizeForFilename(value, maxLen) {
    return value
        .replace(/[^a-zA-Z0-9.-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, maxLen);
}
