import { getDriverStatus } from "./daemon/client.js";
import { discoverLocalCdp } from "./local-cdp-discovery.js";
import { type DriverFlags } from "./command-cli.js";
import { resolveConnectionTarget } from "./mode.js";
import type { ConnectionTarget } from "./types.js";
export type DoctorCheckStatus = "ok" | "warn" | "fail" | "skip";
export type DoctorVerdict = "ok" | "warn" | "fail";
export interface DoctorCheck {
    details?: Record<string, unknown>;
    fix?: string;
    message: string;
    name: string;
    status: DoctorCheckStatus;
}
export interface DoctorReport {
    checks: DoctorCheck[];
    next?: string;
    paths: {
        lock: string;
        pid: string;
        runtimeDir: string;
        socket: string;
    };
    session: string;
    target?: ConnectionTarget;
    verdict: DoctorVerdict;
}
export interface BuildDoctorReportOptions {
    flags: DriverFlags;
    session: string;
}
export interface DoctorDeps {
    discoverLocalCdp?: typeof discoverLocalCdp;
    env?: NodeJS.ProcessEnv;
    getDriverStatus?: typeof getDriverStatus;
    isProcessAlive?: (pid: number) => boolean;
    readPackageVersion?: () => Promise<string>;
    resolveConnectionTarget?: typeof resolveConnectionTarget;
}
export declare function buildDoctorReport(options: BuildDoctorReportOptions, deps?: DoctorDeps): Promise<DoctorReport>;
export declare function renderDoctorReport(report: DoctorReport): string;
