type CdpSession = {
    off?: (event: string, listener: (...args: unknown[]) => void) => void;
    on: (event: string, listener: (...args: unknown[]) => void) => void;
    send: <T = unknown>(method: string, params?: Record<string, unknown>) => Promise<T>;
};
type StagehandPageWithMainFrame = {
    mainFrame: () => {
        session: CdpSession;
    };
};
export declare class NetworkCapture {
    private readonly session;
    private cdpSession;
    private counter;
    private enabled;
    private readonly pendingRequests;
    private readonly requestDirs;
    private readonly requestStartTimes;
    private readonly responseMetadata;
    private readonly listeners;
    private networkDir;
    constructor(session: string);
    enable(page: StagehandPageWithMainFrame): Promise<{
        alreadyEnabled?: boolean;
        enabled: true;
        path: string;
    }>;
    disable(): Promise<{
        alreadyDisabled?: boolean;
        enabled: false;
        path: string | null;
    }>;
    path(): {
        enabled: boolean;
        path: string;
    };
    clear(): Promise<{
        cleared: boolean;
        error?: string;
        path: string;
    }>;
    private addListener;
    private handleRequestWillBeSent;
    private handleResponseReceived;
    private handleLoadingFinished;
    private handleLoadingFailed;
    private writeRequest;
    private writeResponse;
    private forget;
}
export {};
