export interface LocalCdpDiscovery {
    source: string;
    wsUrl: string;
}
interface DevToolsActivePortInfo {
    port: number;
    wsPath: string;
}
interface DiscoverLocalCdpOptions {
    fallbackPorts?: number[];
    userDataDirs?: string[];
}
interface ResolveWsTargetFromPortOptions {
    userDataDirs?: string[];
}
export declare function getChromeUserDataDirs(): string[];
export declare function buildDevToolsWsUrl(port: number, wsPath: string): string;
export declare function readDevToolsActivePort(userDataDir: string): Promise<DevToolsActivePortInfo | null>;
export declare function resolveWsTargetFromPort(port: number, options?: ResolveWsTargetFromPortOptions): Promise<string>;
export declare function discoverLocalCdp(options?: DiscoverLocalCdpOptions): Promise<LocalCdpDiscovery | null>;
export {};
