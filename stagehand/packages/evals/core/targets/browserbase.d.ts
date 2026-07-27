export declare function launchRunnerProvidedBrowserbaseChrome(): Promise<{
    wsUrl: string;
    sessionId: string;
    sessionUrl: string;
    debugUrl?: string;
    cleanup: () => Promise<void>;
}>;
