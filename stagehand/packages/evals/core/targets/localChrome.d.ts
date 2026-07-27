export declare function resolveLocalChromeExecutablePath(): string | undefined;
export declare function launchRunnerProvidedLocalChrome(): Promise<{
    wsUrl: string;
    cleanup: () => Promise<void>;
}>;
