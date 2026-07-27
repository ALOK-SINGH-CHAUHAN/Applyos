import { detectAgent } from "./agent.js";
import { resolveInstallId } from "./identity.js";
import { getRunTelemetry, resetRunTelemetry } from "./run-telemetry.js";
const browserbaseTelemetrySource = "cli";
const browserbaseTelemetryHost = "https://us.i.posthog.com";
const browserbaseTelemetryTimeoutMs = 400;
const browserbaseTelemetryProjectToken = "phc_CKQBSpdeU2GGyBgcBhW8ZbDnhEVbZbuzMsqhMb9YRs5x";
let telemetryState;
let telemetryClient;
let telemetryClientVersion;
export function startTelemetryInvocation(startedAtMs = Date.now()) {
    resetRunTelemetry();
    telemetryState = { startedAtMs };
}
export function captureCommandInvoked(CommandClass, cliVersion) {
    const state = getTelemetryState();
    const command = createCommandInvocation(CommandClass, state.startedAtMs);
    state.command = command;
    state.pendingInvokedCapture = getCliTelemetry(cliVersion)
        .capture("cli.command_invoked", commandInvokedProperties(command))
        .catch(() => {
        // Best-effort telemetry should never affect CLI behavior.
    });
}
export function recordCommandError(type, code, telemetry = {}) {
    const state = getTelemetryState();
    state.recordedError = { type, code, telemetry };
}
export async function captureCommandCompleted(cliVersion, error) {
    const state = telemetryState;
    const command = state?.command;
    if (!state || !command) {
        return;
    }
    const exitCode = resolveExitCode(error);
    const success = exitCode === 0;
    const completionCapture = getCliTelemetry(cliVersion)
        .capture("cli.command_completed", commandCompletedProperties(command, {
        error,
        exitCode,
        recordedError: state.recordedError,
        success,
    }))
        .catch(() => {
        // Best-effort telemetry should never affect CLI behavior.
    });
    await Promise.allSettled([
        state.pendingInvokedCapture ?? Promise.resolve(),
        completionCapture,
    ]);
}
/**
 * Captures a `cli.command_not_found` event. Privacy: only the sanitized
 * attempted command id and the computed suggestion are sent — never raw argv,
 * which can contain URLs, selectors, or secrets.
 */
export async function captureCommandNotFound(cliVersion, attemptedCommand, suggestedCommand) {
    await getCliTelemetry(cliVersion)
        .capture("cli.command_not_found", {
        attempted_command: attemptedCommand
            ? resolveCommandPath(attemptedCommand)
            : null,
        suggested_command: suggestedCommand
            ? resolveCommandPath(suggestedCommand)
            : null,
    })
        .catch(() => {
        // Best-effort telemetry should never affect CLI behavior.
    });
}
function createCliTelemetry(options) {
    const env = options.env ?? process.env;
    const transport = resolveTransportConfig(env);
    const telemetryEnabled = !isTelemetryDisabled(env);
    const distinctIdPromise = telemetryEnabled
        ? resolveInstallId(env, options.sessionId)
        : Promise.resolve("");
    const agentPromise = telemetryEnabled ? detectAgent() : Promise.resolve(null);
    const baseProperties = {
        source: browserbaseTelemetrySource,
        cli_version: options.cliVersion,
        node_version: process.version,
        platform: process.platform,
        arch: process.arch,
        $process_person_profile: false,
    };
    return {
        async capture(event, properties) {
            if (!telemetryEnabled) {
                return;
            }
            const [distinctId, agent] = await Promise.all([
                distinctIdPromise,
                agentPromise,
            ]);
            await posthogCapture(transport, {
                api_key: transport.projectToken,
                distinct_id: distinctId,
                event,
                timestamp: new Date().toISOString(),
                properties: {
                    ...baseProperties,
                    agent,
                    ...properties,
                },
            });
        },
    };
}
function getCliTelemetry(cliVersion) {
    if (!telemetryClient || telemetryClientVersion !== cliVersion) {
        telemetryClient = createCliTelemetry({ cliVersion });
        telemetryClientVersion = cliVersion;
    }
    return telemetryClient;
}
function getTelemetryState() {
    telemetryState ??= { startedAtMs: Date.now() };
    return telemetryState;
}
function createCommandInvocation(CommandClass, startedAtMs) {
    const commandPath = resolveCommandPath(CommandClass.id);
    const pathTokens = commandPath.split(".").filter(Boolean);
    return {
        commandPath,
        topLevelCommand: pathTokens[0] ?? CommandClass.id,
        leafCommand: pathTokens.at(-1) ?? CommandClass.id,
        startedAtMs,
    };
}
function commandInvokedProperties(invocation) {
    return {
        command_path: invocation.commandPath,
        top_level_command: invocation.topLevelCommand,
        leaf_command: invocation.leafCommand,
        command_depth: invocation.commandPath.split(".").filter(Boolean).length,
    };
}
function commandCompletedProperties(invocation, completion) {
    const durationMs = Date.now() - invocation.startedAtMs;
    const errorType = completion.success
        ? null
        : (completion.recordedError?.type ?? inferErrorType(completion.error));
    const runTelemetry = getRunTelemetry();
    const failureTelemetry = completion.recordedError?.telemetry;
    const resultCode = failureTelemetry?.resultCode ??
        runTelemetry.resultCode ??
        fallbackResultCode(completion.success, errorType);
    return {
        command_path: invocation.commandPath,
        top_level_command: invocation.topLevelCommand,
        leaf_command: invocation.leafCommand,
        command_depth: invocation.commandPath.split(".").filter(Boolean).length,
        duration_ms: Math.max(0, durationMs),
        exit_code: completion.exitCode,
        success: completion.success,
        error_type: errorType,
        error_code: completion.success
            ? null
            : (completion.recordedError?.code ?? inferErrorCode(completion.error)),
        result_code: resultCode,
        http_status: failureTelemetry?.httpStatus ?? runTelemetry.httpStatus ?? null,
        request_had_http_response: failureTelemetry?.requestHadHttpResponse ??
            runTelemetry.requestHadHttpResponse ??
            null,
        skill_id: runTelemetry.skillId ?? null,
    };
}
function fallbackResultCode(success, errorType) {
    if (success) {
        return "ok";
    }
    if (errorType === "oclif") {
        return "usage_error";
    }
    return "unexpected";
}
function resolveCommandPath(commandId) {
    return commandId.split(":").filter(Boolean).join(".");
}
function resolveExitCode(error) {
    if (error) {
        const oclifExit = error.oclif?.exit;
        if (typeof oclifExit === "number") {
            return oclifExit;
        }
        const exitCode = error.exitCode;
        if (typeof exitCode === "number") {
            return exitCode;
        }
        return typeof process.exitCode === "number" ? process.exitCode : 1;
    }
    return typeof process.exitCode === "number" ? process.exitCode : 0;
}
function inferErrorType(error) {
    if (!error) {
        return null;
    }
    const oclifExit = error.oclif?.exit;
    return typeof oclifExit === "number" ? "oclif" : "runtime";
}
function inferErrorCode(error) {
    if (!error) {
        return null;
    }
    const code = error.code;
    if (typeof code === "string" && code.trim()) {
        return sanitizeErrorCode(code);
    }
    return sanitizeErrorCode(error.name || "Error");
}
function sanitizeErrorCode(value) {
    return value.replaceAll(/[^A-Za-z0-9_.:-]/g, "_").slice(0, 80) || "Error";
}
function resolveTransportConfig(env) {
    const host = normalizeHost(env.BROWSERBASE_TELEMETRY_HOST ?? browserbaseTelemetryHost);
    const timeoutMs = parseTimeoutMs(env.BROWSERBASE_TELEMETRY_TIMEOUT_MS);
    return {
        host,
        timeoutMs,
        projectToken: browserbaseTelemetryProjectToken,
    };
}
function parseTimeoutMs(value) {
    if (!value) {
        return browserbaseTelemetryTimeoutMs;
    }
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return browserbaseTelemetryTimeoutMs;
    }
    return parsed;
}
function normalizeHost(host) {
    return host.endsWith("/") ? host.slice(0, -1) : host;
}
function isTelemetryDisabled(env) {
    return (envFlagEnabled(env.DO_NOT_TRACK) ||
        envFlagEnabled(env.BROWSERBASE_TELEMETRY_DISABLED) ||
        isCiEnvironment(env) ||
        isUnconfiguredTestEnvironment(env));
}
function isCiEnvironment(env) {
    const value = env.CI;
    if (!value) {
        return false;
    }
    return !isExplicitFalse(value);
}
function isUnconfiguredTestEnvironment(env) {
    return env.NODE_ENV === "test" && !env.BROWSERBASE_TELEMETRY_HOST;
}
function envFlagEnabled(value) {
    if (!value) {
        return false;
    }
    return !isExplicitFalse(value);
}
function isExplicitFalse(value) {
    const normalized = value.trim().toLowerCase();
    return (normalized === "" ||
        normalized === "0" ||
        normalized === "false" ||
        normalized === "no" ||
        normalized === "off");
}
async function posthogCapture(transport, payload) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), transport.timeoutMs);
    timeout.unref?.();
    const endpoint = `${transport.host}/i/v0/e/`;
    try {
        await fetch(endpoint, {
            method: "POST",
            signal: controller.signal,
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify(payload),
        });
    }
    catch {
        // Best-effort telemetry should never affect CLI behavior.
    }
    finally {
        clearTimeout(timeout);
    }
}
