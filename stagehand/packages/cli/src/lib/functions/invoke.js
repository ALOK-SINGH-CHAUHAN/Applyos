import { fail } from "../errors.js";
import { setRunTelemetryCompletion } from "../run-telemetry.js";
import { functionsGet, functionsPost, parseOptionalJsonValueArg, pollUntil, resolveFunctionsApiConfig, } from "./shared.js";
export async function invokeFunction(options) {
    const config = resolveFunctionsApiConfig(options);
    if (options.checkStatus) {
        const status = await functionsGet(config, `/v1/functions/invocations/${options.checkStatus}`);
        console.log(JSON.stringify(status, null, 2));
        return;
    }
    if (!options.functionId) {
        fail("functionId is required unless --check-status is used.");
    }
    const params = parseOptionalJsonValueArg(options.params, "params");
    const invocation = await functionsPost(config, `/v1/functions/${options.functionId}/invoke`, { params });
    if (options.noWait) {
        console.log(JSON.stringify(invocation, null, 2));
        return;
    }
    const finalStatus = await pollUntil(() => functionsGet(config, `/v1/functions/invocations/${invocation.id}`), {
        done: (result) => !["PENDING", "RUNNING"].includes(result.status),
        intervalMs: 1_000,
        maxAttempts: 900,
    });
    console.log(JSON.stringify(finalStatus, null, 2));
    if (finalStatus.status === "FAILED") {
        setRunTelemetryCompletion({
            resultCode: "functions_invocation_failed",
        });
        process.exitCode = 1;
    }
}
