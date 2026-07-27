import { randomUUID } from "crypto";
import { V3 } from "@browserbasehq/stagehand";
const DEFAULT_MAX_CAPACITY = 100;
const DEFAULT_TTL_MS = 0; // 0 = infinite (no TTL-based eviction)
function hasProviderAuth(model) {
    return "auth" in model && model.auth !== undefined;
}
export function withModelApiKeyFallback(model, modelApiKey) {
    if (!modelApiKey ||
        hasProviderAuth(model) ||
        ("apiKey" in model && model.apiKey)) {
        return model;
    }
    return { ...model, apiKey: modelApiKey };
}
/**
 * In-memory implementation of SessionStore with full caching support.
 *
 * Features:
 * - LRU eviction when at capacity
 * - TTL-based expiration
 * - Lazy V3 instance creation
 * - Dynamic logger updates for streaming
 * - Automatic cleanup of evicted sessions
 *
 * This is the default implementation used when no custom store is provided.
 * For stateless pod architectures, use a database-backed implementation.
 */
export class InMemorySessionStore {
    first = null;
    last = null;
    items = new Map();
    maxCapacity;
    ttlMs;
    cleanupInterval = null;
    constructor(config) {
        this.maxCapacity = config?.maxCapacity ?? DEFAULT_MAX_CAPACITY;
        this.ttlMs = config?.ttlMs ?? DEFAULT_TTL_MS;
        this.startCleanupInterval();
    }
    /**
     * Start periodic cleanup of expired sessions
     */
    startCleanupInterval() {
        // Run cleanup every minute
        this.cleanupInterval = setInterval(() => {
            this.cleanupExpired();
        }, 60_000);
        // Allow process to exit gracefully even if this timer is still active
        this.cleanupInterval.unref();
    }
    /**
     * Cleanup expired sessions
     */
    async cleanupExpired() {
        const now = Date.now();
        const expiredIds = [];
        for (const [sessionId, node] of this.items.entries()) {
            if (this.ttlMs > 0 && node.expiry <= now) {
                expiredIds.push(sessionId);
            }
        }
        for (const sessionId of expiredIds) {
            await this.deleteSession(sessionId);
        }
    }
    /**
     * Bump a node to the end of the LRU list (most recently used)
     */
    bumpNode(node) {
        // Update expiry
        node.expiry = this.ttlMs > 0 ? Date.now() + this.ttlMs : Infinity;
        if (this.last === node) {
            return; // Already most recent
        }
        const { prev, next } = node;
        // Unlink from current position
        if (prev)
            prev.next = next;
        if (next)
            next.prev = prev;
        if (this.first === node)
            this.first = next;
        // Link to end
        node.prev = this.last;
        node.next = null;
        if (this.last)
            this.last.next = node;
        this.last = node;
        if (!this.first)
            this.first = node;
    }
    /**
     * Evict the least recently used session
     */
    async evictLru() {
        const lruNode = this.first;
        if (!lruNode)
            return;
        await this.deleteSession(lruNode.sessionId);
    }
    async startSession(params) {
        // Generate session ID or use provided browserbase session ID
        const sessionId = params.browserbaseSessionID ?? randomUUID();
        // Store the session
        await this.createSession(sessionId, params);
        return {
            sessionId,
            cdpUrl: params.connectUrl ?? "",
            available: true,
        };
    }
    async endSession(sessionId) {
        await this.deleteSession(sessionId);
    }
    async hasSession(sessionId) {
        const node = this.items.get(sessionId);
        if (!node)
            return false;
        // Check if expired
        if (this.ttlMs > 0 && node.expiry <= Date.now()) {
            await this.deleteSession(sessionId);
            return false;
        }
        return true;
    }
    async getOrCreateStagehand(sessionId, ctx) {
        const node = this.items.get(sessionId);
        if (!node) {
            throw new Error(`Session not found: ${sessionId}`);
        }
        // Check if expired
        if (this.ttlMs > 0 && node.expiry <= Date.now()) {
            await this.deleteSession(sessionId);
            throw new Error(`Session expired: ${sessionId}`);
        }
        // Bump to most recently used
        this.bumpNode(node);
        // Update logger reference for this request
        if (ctx.logger) {
            node.loggerRef.current = ctx.logger;
        }
        // If V3 instance exists, return it
        if (node.stagehand) {
            return node.stagehand;
        }
        // Create V3 instance (lazy initialization)
        const options = this.buildV3Options(node.params, ctx, node.loggerRef);
        const stagehand = new V3(options);
        try {
            await stagehand.init();
        }
        catch (error) {
            try {
                await stagehand.close();
            }
            catch {
                // best-effort cleanup for failed init attempts
            }
            throw error;
        }
        node.stagehand = stagehand;
        return stagehand;
    }
    /**
     * Build V3Options from stored params and request context
     */
    buildV3Options(params, ctx, loggerRef) {
        const isBrowserbase = params.browserType === "browserbase";
        const options = {
            env: isBrowserbase ? "BROWSERBASE" : "LOCAL",
            model: ctx.requestModelConfig
                ? withModelApiKeyFallback(ctx.requestModelConfig, ctx.modelApiKey)
                : {
                    modelName: params.modelName,
                    apiKey: ctx.modelApiKey,
                },
            verbose: params.verbose,
            systemPrompt: params.systemPrompt,
            selfHeal: params.selfHeal,
            domSettleTimeout: params.domSettleTimeoutMs,
            experimental: params.experimental,
            // Wrap logger to use the ref so it can be updated per-request
            logger: (message) => {
                if (loggerRef.current) {
                    loggerRef.current(message);
                }
            },
        };
        if (isBrowserbase) {
            options.apiKey = params.browserbaseApiKey;
            options.projectId = params.browserbaseProjectId;
            if (params.browserbaseSessionID) {
                options.browserbaseSessionID = params.browserbaseSessionID;
            }
            if (params.browserbaseSessionCreateParams) {
                options.browserbaseSessionCreateParams =
                    params.browserbaseSessionCreateParams;
            }
        }
        else if (params.localBrowserLaunchOptions) {
            options.localBrowserLaunchOptions = params.localBrowserLaunchOptions;
        }
        return options;
    }
    async createSession(sessionId, params) {
        // Check if already exists
        if (this.items.has(sessionId)) {
            throw new Error(`Session already exists: ${sessionId}`);
        }
        // Evict LRU if at capacity
        if (this.maxCapacity > 0 && this.items.size >= this.maxCapacity) {
            await this.evictLru();
        }
        // Create new node
        const node = {
            sessionId,
            params,
            stagehand: null, // Lazy initialization
            loggerRef: {},
            expiry: this.ttlMs > 0 ? Date.now() + this.ttlMs : Infinity,
            prev: this.last,
            next: null,
        };
        this.items.set(sessionId, node);
        // Link to end of list
        if (this.last)
            this.last.next = node;
        this.last = node;
        if (!this.first)
            this.first = node;
    }
    async deleteSession(sessionId) {
        const node = this.items.get(sessionId);
        if (!node)
            return;
        // Close V3 instance if it exists
        if (node.stagehand) {
            try {
                await node.stagehand.close();
            }
            catch (error) {
                console.error(`Error closing stagehand for session ${sessionId}:`, error);
            }
        }
        // Remove from map
        this.items.delete(sessionId);
        // Unlink from list
        const { prev, next } = node;
        if (prev)
            prev.next = next;
        if (next)
            next.prev = prev;
        if (this.first === node)
            this.first = next;
        if (this.last === node)
            this.last = prev;
    }
    async getSessionConfig(sessionId) {
        const node = this.items.get(sessionId);
        if (!node) {
            throw new Error(`Session not found: ${sessionId}`);
        }
        // Return the stored params (contains browser metadata needed downstream)
        return node.params;
    }
    updateCacheConfig(config) {
        if (config.maxCapacity !== undefined) {
            if (config.maxCapacity <= 0) {
                throw new Error("Max capacity must be greater than 0");
            }
            const previousCapacity = this.maxCapacity;
            this.maxCapacity = config.maxCapacity;
            // Evict excess if new capacity is smaller
            if (this.maxCapacity < previousCapacity) {
                const excess = this.items.size - this.maxCapacity;
                for (let i = 0; i < excess; i++) {
                    // Fire and forget - don't await to match cloud behavior
                    this.evictLru().catch(console.error);
                }
            }
        }
        if (config.ttlMs !== undefined) {
            this.ttlMs = config.ttlMs;
        }
    }
    getCacheConfig() {
        return {
            maxCapacity: this.maxCapacity,
            ttlMs: this.ttlMs,
        };
    }
    async destroy() {
        // Stop cleanup interval
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        // Close all V3 instances
        const sessionIds = Array.from(this.items.keys());
        await Promise.all(sessionIds.map((id) => this.deleteSession(id)));
    }
    /**
     * Get the number of cached sessions
     */
    get size() {
        return this.items.size;
    }
}
