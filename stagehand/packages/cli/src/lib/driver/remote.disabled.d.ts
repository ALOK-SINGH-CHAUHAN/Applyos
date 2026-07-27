import type { DriverInitHints, RemoteDoctorResult, RemoteInitErrorClassification, StagehandConstructorOptions } from "./remote-types.js";
import type { ConnectionTarget } from "./types.js";
export declare function resolveExplicitRemoteTarget(): ConnectionTarget;
export declare function autoSelectRemoteTarget(): ConnectionTarget | null;
export declare function forwardedEnvKeys(): readonly string[];
export declare function remoteStagehandOptions(): Promise<StagehandConstructorOptions>;
export declare function classifyRemoteInitError(error: unknown): RemoteInitErrorClassification;
export declare function driverInitHints(): DriverInitHints;
export declare function remoteDoctorCheck(): RemoteDoctorResult;
