interface UpdateCheckOptions {
    cacheFile?: string;
}
export declare function maybeAutoUpdateCli(currentVersion: string, env?: NodeJS.ProcessEnv, options?: UpdateCheckOptions): Promise<void>;
export declare function refreshUpdateCheckCache(env?: NodeJS.ProcessEnv, options?: UpdateCheckOptions): Promise<void>;
export {};
