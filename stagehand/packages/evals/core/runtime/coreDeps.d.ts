type BrowserbaseConstructor = new (options: {
    apiKey: string;
}) => {
    sessions: {
        create: (payload: Record<string, unknown>) => Promise<unknown>;
        update: (sessionId: string, payload: Record<string, unknown>) => Promise<unknown>;
        debug?: (sessionId: string) => Promise<unknown>;
    };
};
type WsModule = {
    new (url: string, options?: Record<string, unknown>): {
        on: (event: string, listener: (...args: unknown[]) => void) => void;
        once: (event: string, listener: (...args: unknown[]) => void) => void;
        send: (data: string, cb?: (error?: Error) => void) => void;
        close: () => void;
        readyState: number;
    };
    OPEN?: number;
};
export declare function loadBrowserbaseSdk(): BrowserbaseConstructor;
export declare function loadWsModule(): WsModule;
export {};
