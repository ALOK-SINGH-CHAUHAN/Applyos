interface ResolveWsTargetOptions {
    httpTimeoutMs?: number;
    userDataDirs?: string[];
}
export declare function resolveWsTarget(input: string, options?: ResolveWsTargetOptions): Promise<string>;
export {};
