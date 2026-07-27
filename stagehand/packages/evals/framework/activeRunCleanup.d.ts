export declare function onceAsync(fn: () => Promise<void>): () => Promise<void>;
export declare function registerActiveRunCleanup(cleanup: () => Promise<void>): () => void;
export declare function cleanupActiveRunResources(): Promise<void>;
