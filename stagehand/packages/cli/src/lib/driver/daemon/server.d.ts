import type { ConnectionTarget } from "../types.js";
interface RunDriverDaemonOptions {
    session: string;
    target: ConnectionTarget;
}
export declare function runDriverDaemon({ session, target, }: RunDriverDaemonOptions): Promise<void>;
export {};
