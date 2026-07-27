import type { ForwardedEnv } from "./daemon/forwarded-env.js";
import type { DriverModeFlags } from "./mode.js";
import type { DriverInitHints, RemoteDoctorResult, RemoteInitErrorClassification, StagehandConstructorOptions } from "./remote-types.js";
import type { ConnectionTarget, RemoteConnectionTarget } from "./types.js";
/**
 * Real Browserbase capability. This is the ONLY module that reads
 * `BROWSERBASE_API_KEY`; it is excluded from `build:local-only` so that
 * local-only artifacts cannot reach Browserbase.
 */
export declare function resolveExplicitRemoteTarget(flags: DriverModeFlags): ConnectionTarget;
export declare function autoSelectRemoteTarget(): ConnectionTarget | null;
/**
 * Env vars the client forwards to a running daemon. Only the API key needs
 * forwarding: the Browserbase backend infers the project from the key, so a
 * project id is not required for session creation. (A multi-project key that
 * wants to pin a non-default project via BROWSERBASE_PROJECT_ID is a rare edge
 * case; that still resolves from the daemon's own env, not the forwarded set.)
 */
export declare function forwardedEnvKeys(): readonly string[];
export declare function remoteStagehandOptions(target?: RemoteConnectionTarget, forwardedEnv?: ForwardedEnv): Promise<StagehandConstructorOptions>;
/**
 * Map a failed remote `stagehand.init()` to an actionable message and a
 * stable result code. Browserbase SDK errors carry an HTTP `status`.
 */
export declare function classifyRemoteInitError(error: unknown): RemoteInitErrorClassification;
export declare function driverInitHints(): DriverInitHints;
export declare function remoteDoctorCheck(env: NodeJS.ProcessEnv): RemoteDoctorResult;
