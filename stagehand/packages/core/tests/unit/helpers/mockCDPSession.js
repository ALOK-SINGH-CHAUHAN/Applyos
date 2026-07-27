export class MockCDPSession {
    handlers;
    id;
    calls = [];
    listeners = new Map();
    constructor(handlers = {}, sessionId = "mock-session") {
        this.handlers = handlers;
        this.id = sessionId;
    }
    async send(method, params = {}) {
        this.calls.push({ method, params });
        const handler = this.handlers[method];
        if (!handler)
            return {};
        return (await handler(params));
    }
    on(event, handler) {
        const handlers = this.listeners.get(event) ?? new Set();
        handlers.add(handler);
        this.listeners.set(event, handlers);
    }
    off(event, handler) {
        this.listeners.get(event)?.delete(handler);
    }
    emit(event, params = {}) {
        for (const handler of this.listeners.get(event) ?? []) {
            handler(params);
        }
    }
    listenerCount(event) {
        return this.listeners.get(event)?.size ?? 0;
    }
    async close() { }
    callsFor(method) {
        return this.calls
            .filter((call) => call.method === method)
            .map(({ params }) => ({ params }));
    }
}
