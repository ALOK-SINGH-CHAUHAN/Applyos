import type { ConnectionTarget } from "./types.js";
export interface DriverModeFlags {
    "auto-connect"?: boolean;
    cdp?: string;
    "chrome-arg"?: string[];
    headed?: boolean;
    headless?: boolean;
    "ignore-default-chrome-arg"?: string[];
    local?: boolean;
    "no-default-chrome-args"?: boolean;
    proxies?: boolean;
    remote?: boolean;
    "target-id"?: string;
    verified?: boolean;
}
export declare function hasChromeArgFlags(flags: DriverModeFlags): boolean;
export declare function remoteOnlyFlagsInUse(flags: DriverModeFlags): string[];
export declare function resolveConnectionTarget(flags: DriverModeFlags): Promise<ConnectionTarget>;
export declare function targetsCompatible(left: ConnectionTarget, right: ConnectionTarget): boolean;
