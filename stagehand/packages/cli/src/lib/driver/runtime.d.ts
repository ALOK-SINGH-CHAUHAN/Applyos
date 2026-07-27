import type { DriverCommandName } from "./commands/types.js";
import type { ConnectionTarget } from "./types.js";
export declare function runDriverCommandWithTarget(session: string, target: ConnectionTarget, command: DriverCommandName, params?: unknown): Promise<unknown>;
