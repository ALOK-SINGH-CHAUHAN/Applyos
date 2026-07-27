export interface TailCdpOptions {
    domains?: string[];
    pretty?: boolean;
}
export declare const DEFAULT_CDP_DOMAINS: string[];
export declare function tailCdp(target: string, options?: TailCdpOptions): Promise<void>;
