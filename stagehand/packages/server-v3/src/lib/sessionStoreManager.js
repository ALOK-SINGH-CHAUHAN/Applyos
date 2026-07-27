import { InMemorySessionStore } from "./InMemorySessionStore.js";
let sessionStore = null;
export function initializeSessionStore(config) {
    if (!sessionStore) {
        sessionStore = new InMemorySessionStore(config);
    }
    return sessionStore;
}
export function getSessionStore() {
    if (!sessionStore) {
        throw new Error("Session store has not been initialized");
    }
    return sessionStore;
}
export async function destroySessionStore() {
    if (sessionStore) {
        await sessionStore.destroy();
        sessionStore = null;
    }
}
