import type { Api } from "@browserbasehq/stagehand";
import { V3 } from "@browserbasehq/stagehand";
import type { SessionStore, CreateSessionParams, RequestContext, SessionCacheConfig, SessionStartResult } from "./SessionStore.js";
export declare function withModelApiKeyFallback(model: Api.ModelConfig, modelApiKey?: string): Api.ModelConfig;
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
export declare class InMemorySessionStore implements SessionStore {
    private first;
    private last;
    private items;
    private maxCapacity;
    private ttlMs;
    private cleanupInterval;
    constructor(config?: SessionCacheConfig);
    /**
     * Start periodic cleanup of expired sessions
     */
    private startCleanupInterval;
    /**
     * Cleanup expired sessions
     */
    private cleanupExpired;
    /**
     * Bump a node to the end of the LRU list (most recently used)
     */
    private bumpNode;
    /**
     * Evict the least recently used session
     */
    private evictLru;
    startSession(params: CreateSessionParams): Promise<SessionStartResult>;
    endSession(sessionId: string): Promise<void>;
    hasSession(sessionId: string): Promise<boolean>;
    getOrCreateStagehand(sessionId: string, ctx: RequestContext): Promise<V3>;
    /**
     * Build V3Options from stored params and request context
     */
    private buildV3Options;
    createSession(sessionId: string, params: CreateSessionParams): Promise<void>;
    deleteSession(sessionId: string): Promise<void>;
    getSessionConfig(sessionId: string): Promise<CreateSessionParams>;
    updateCacheConfig(config: SessionCacheConfig): void;
    getCacheConfig(): SessionCacheConfig;
    destroy(): Promise<void>;
    /**
     * Get the number of cached sessions
     */
    get size(): number;
}
