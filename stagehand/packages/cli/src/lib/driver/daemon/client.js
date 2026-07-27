import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import net from "node:net";
import { CommandFailure, fail } from "../../errors.js";
import { targetsCompatible } from "../mode.js";
import { cleanupDaemonFiles, ensureRuntimeDir, getLockPath, getPidPath, getSocketPath, PRIVATE_FILE_MODE, } from "./paths.js";
import { collectForwardedEnv } from "./forwarded-env.js";
import { isProcessAlive } from "./process.js";
import { ResponseSchema } from "./protocol.js";
export async function ensureDriverDaemon({ session, target, }) {
    await ensureRuntimeDir();
    const existing = await tryDriverStatus(session);
    if (existing) {
        assertCompatibleTarget(session, existing, target);
        return;
    }
    const locked = await acquireLock(session);
    if (!locked) {
        fail(`Timed out waiting for driver daemon lock for session "${session}".`, 1, { resultCode: "daemon_lock_timeout" });
    }
    try {
        const afterLock = await tryDriverStatus(session);
        if (afterLock) {
            assertCompatibleTarget(session, afterLock, target);
            return;
        }
        if (await isDaemonPidAlive(session)) {
            fail(`Driver daemon session "${session}" is running but not responding. Run browse stop --session ${session} --force to clean it up.`, 1, { resultCode: "daemon_unresponsive" });
        }
        spawnDaemon(session, target);
        await waitForSocketReady(getSocketPath(session), 30_000);
    }
    finally {
        await releaseLock(session);
    }
}
export async function openViaDaemon(session, url, options = {}) {
    return sendDriverRequest(session, {
        ...options,
        forwardedEnv: await collectForwardedEnv(),
        id: requestId(),
        type: "open",
        url,
    });
}
export async function runDriverCommandViaDaemon(session, command, params) {
    return sendDriverRequest(session, {
        command,
        forwardedEnv: await collectForwardedEnv(),
        id: requestId(),
        params,
        type: "command",
    });
}
export async function getDriverStatus(session) {
    return tryDriverStatus(session);
}
export async function stopDriverDaemon(session, force = false) {
    const status = await tryDriverStatus(session);
    if (!status) {
        if (force) {
            await cleanupDaemonFiles(session);
        }
        return { stopped: false };
    }
    try {
        return await sendDriverRequest(session, {
            id: requestId(),
            type: "stop",
        });
    }
    catch (error) {
        if (!force)
            throw error;
        await cleanupDaemonFiles(session);
        return { stopped: true };
    }
}
function assertCompatibleTarget(session, status, target) {
    if (targetsCompatible(status.target, target))
        return;
    fail(`Session "${session}" is already running in ${status.mode} mode. Run browse stop --session ${session} before changing modes.`);
}
async function tryDriverStatus(session) {
    if (!(await isSocketConnectable(getSocketPath(session), 500))) {
        await cleanupStaleDaemonFiles(session);
        return null;
    }
    try {
        return await sendDriverRequest(session, {
            id: requestId(),
            type: "status",
        });
    }
    catch {
        await cleanupStaleDaemonFiles(session);
        return null;
    }
}
async function sendDriverRequest(session, request) {
    const socketPath = getSocketPath(session);
    return new Promise((resolve, reject) => {
        const socket = net.createConnection(socketPath);
        let buffer = "";
        let settled = false;
        const failRequest = (error) => {
            if (settled)
                return;
            settled = true;
            clearTimeout(timeout);
            socket.destroy();
            reject(error);
        };
        const completeRequest = (value) => {
            if (settled)
                return;
            settled = true;
            clearTimeout(timeout);
            socket.end();
            resolve(value);
        };
        const incompleteResponseError = () => {
            const detail = buffer
                ? "with an incomplete response"
                : "without a response";
            return new Error(`Driver daemon session "${session}" closed ${detail}.`);
        };
        const timeout = setTimeout(() => {
            failRequest(new CommandFailure(`Timed out waiting for driver daemon session "${session}".`, 1, { resultCode: "daemon_socket_timeout" }));
        }, 35_000);
        socket.on("connect", () => {
            socket.write(`${JSON.stringify(request)}\n`);
        });
        socket.on("data", (chunk) => {
            buffer += chunk.toString();
            const newline = buffer.indexOf("\n");
            if (newline === -1)
                return;
            try {
                const response = ResponseSchema.parse(JSON.parse(buffer.slice(0, newline)));
                if (response.type === "error") {
                    failRequest(new CommandFailure(response.error, 1, {
                        ...(response.code ? { resultCode: response.code } : {}),
                        ...(response.httpStatus !== undefined
                            ? { httpStatus: response.httpStatus }
                            : {}),
                    }));
                    return;
                }
                completeRequest(response.data);
            }
            catch (error) {
                failRequest(error instanceof Error ? error : new Error(String(error)));
            }
        });
        socket.on("error", (error) => {
            failRequest(error);
        });
        socket.on("end", () => {
            if (!settled)
                failRequest(incompleteResponseError());
        });
        socket.on("close", () => {
            if (!settled)
                failRequest(incompleteResponseError());
        });
    });
}
function spawnDaemon(session, target) {
    const entrypoint = process.argv[1];
    if (!entrypoint) {
        fail("Unable to locate browse CLI entrypoint for daemon startup.", 1, {
            resultCode: "daemon_spawn_failed",
        });
    }
    const child = spawn(process.execPath, [
        entrypoint,
        "daemon",
        "--session",
        session,
        "--target",
        JSON.stringify(target),
    ], {
        detached: true,
        env: process.env,
        stdio: "ignore",
    });
    child.unref();
}
async function waitForSocketReady(socketPath, timeoutMs) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        if (await isSocketConnectable(socketPath, 500))
            return;
        await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error(`Driver daemon socket was not ready after ${timeoutMs}ms.`);
}
function isSocketConnectable(socketPath, timeoutMs) {
    return new Promise((resolve) => {
        const socket = net.createConnection(socketPath);
        const timer = setTimeout(() => {
            socket.destroy();
            resolve(false);
        }, timeoutMs);
        socket.on("connect", () => {
            clearTimeout(timer);
            socket.destroy();
            resolve(true);
        });
        socket.on("error", () => {
            clearTimeout(timer);
            resolve(false);
        });
    });
}
async function cleanupStaleDaemonFiles(session) {
    if (await isDaemonPidAlive(session))
        return;
    await cleanupDaemonFiles(session, { includeLock: false });
}
async function acquireLock(session, timeoutMs = 10_000) {
    const lockPath = getLockPath(session);
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        try {
            const handle = await fs.open(lockPath, "wx", PRIVATE_FILE_MODE);
            try {
                await handle.write(String(process.pid));
            }
            finally {
                await handle.close().catch(() => undefined);
            }
            return true;
        }
        catch (error) {
            if (error.code !== "EEXIST")
                throw error;
            if (await removeStaleLock(lockPath))
                continue;
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
    }
    return false;
}
async function releaseLock(session) {
    await fs.unlink(getLockPath(session)).catch(() => undefined);
}
async function isDaemonPidAlive(session) {
    try {
        const contents = await fs.readFile(getPidPath(session), "utf8");
        const pid = Number(contents.trim());
        return Number.isInteger(pid) && pid > 0 && isProcessAlive(pid);
    }
    catch (error) {
        if (error.code === "ENOENT")
            return false;
        throw error;
    }
}
async function removeStaleLock(lockPath) {
    let ownerPid;
    try {
        const contents = await fs.readFile(lockPath, "utf8");
        const parsed = Number(contents.trim());
        ownerPid = Number.isInteger(parsed) && parsed > 0 ? parsed : null;
    }
    catch (error) {
        if (error.code === "ENOENT")
            return true;
        throw error;
    }
    if (ownerPid && isProcessAlive(ownerPid))
        return false;
    await fs.unlink(lockPath).catch((error) => {
        if (error.code !== "ENOENT")
            throw error;
    });
    return true;
}
function requestId() {
    return `${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
