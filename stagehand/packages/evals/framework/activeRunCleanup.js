const activeRunCleanups = new Map();
export function onceAsync(fn) {
    let promise;
    return () => {
        promise ??= fn();
        return promise;
    };
}
export function registerActiveRunCleanup(cleanup) {
    const key = Symbol("active-run-cleanup");
    activeRunCleanups.set(key, cleanup);
    return () => {
        activeRunCleanups.delete(key);
    };
}
export async function cleanupActiveRunResources() {
    const cleanups = [...activeRunCleanups.values()];
    await Promise.allSettled(cleanups.map((cleanup) => cleanup()));
}
