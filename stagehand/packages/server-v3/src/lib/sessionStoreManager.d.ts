import type { SessionCacheConfig, SessionStore } from "./SessionStore.js";
export declare function initializeSessionStore(config?: SessionCacheConfig): SessionStore;
export declare function getSessionStore(): SessionStore;
export declare function destroySessionStore(): Promise<void>;
