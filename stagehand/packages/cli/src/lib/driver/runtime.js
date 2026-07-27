import { ensureDriverDaemon, openViaDaemon, runDriverCommandViaDaemon, } from "./daemon/client.js";
export async function runDriverCommandWithTarget(session, target, command, params) {
    await ensureDriverDaemon({ session, target });
    if (command === "open" && isOpenCommandParams(params)) {
        return openViaDaemon(session, params.url, params);
    }
    return runDriverCommandViaDaemon(session, command, params);
}
function isOpenCommandParams(params) {
    return (typeof params === "object" &&
        params !== null &&
        typeof params.url === "string");
}
