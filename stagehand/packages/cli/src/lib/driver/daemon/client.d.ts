import type { DriverCommandName } from "../commands/types.js";
import type { ConnectionTarget, DriverStatus, OpenResult } from "../types.js";
interface EnsureDaemonOptions {
    session: string;
    target: ConnectionTarget;
}
interface OpenViaDaemonOptions {
    timeoutMs?: number;
    waitUntil?: "load" | "domcontentloaded" | "networkidle";
}
export declare function ensureDriverDaemon({ session, target, }: EnsureDaemonOptions): Promise<void>;
export declare function openViaDaemon(session: string, url: string, options?: OpenViaDaemonOptions): Promise<OpenResult>;
export declare function runDriverCommandViaDaemon(session: string, command: DriverCommandName, params?: unknown): Promise<unknown>;
export declare function getDriverStatus(session: string): Promise<DriverStatus | null>;
export declare function stopDriverDaemon(session: string, force?: boolean): Promise<{
    stopped: boolean;
}>;
export {};
