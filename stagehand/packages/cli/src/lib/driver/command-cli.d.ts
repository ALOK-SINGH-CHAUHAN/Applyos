import type { DriverCommandName } from "./commands/types.js";
import { type DriverModeFlags } from "./mode.js";
import type { ConnectionTarget } from "./types.js";
export declare const driverCommandFlags: {
    "auto-connect": any;
    cdp: any;
    "chrome-arg": any;
    headed: any;
    headless: any;
    "ignore-default-chrome-arg": any;
    local: any;
    "no-default-chrome-args": any;
    proxies: any;
    remote: any;
    session: any;
    "target-id": any;
    verified: any;
};
export declare const waitUntilFlag: any;
export declare const timeoutMsFlag: any;
export declare const buttonFlag: any;
export type DriverFlags = DriverModeFlags & {
    session?: string;
};
export declare function runDriverCommandFromFlags(command: DriverCommandName, params: unknown, flags: DriverFlags): Promise<void>;
export declare function resolveTargetForCommand(session: string, flags: DriverFlags): Promise<ConnectionTarget>;
export declare function hasExplicitDriverTarget(flags: DriverFlags): boolean;
export declare function parseClip(value: string | undefined): {
    height: number;
    width: number;
    x: number;
    y: number;
} | undefined;
export declare function parseNumber(value: string, name: string): number;
export declare function parseInteger(value: string, name: string): number;
