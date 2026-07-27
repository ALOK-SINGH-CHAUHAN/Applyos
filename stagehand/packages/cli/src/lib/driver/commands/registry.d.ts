import type { DriverSessionManager } from "../session-manager.js";
import type { DriverCommandName } from "./types.js";
export declare function executeDriverCommand(manager: DriverSessionManager, command: DriverCommandName, params: unknown): Promise<unknown>;
