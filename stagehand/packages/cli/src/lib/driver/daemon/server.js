import net from "node:net";
import readline from "node:readline";
import { DriverError } from "../errors.js";
import { DriverSessionManager } from "../session-manager.js";
import { cleanupDaemonFiles, ensureRuntimeDir, getPidPath, getSocketPath, writePrivateFile, } from "./paths.js";
import { parseRequest, serializeResponse, } from "./protocol.js";
export async function runDriverDaemon({ session, target, }) {
    await ensureRuntimeDir();
    await cleanupDaemonFiles(session, { includeLock: false });
    await writePrivateFile(getPidPath(session), String(process.pid));
    const socketPath = getSocketPath(session);
    const manager = new DriverSessionManager(session, target);
    const server = net.createServer();
    let shutdownPromise = null;
    const shutdown = () => {
        shutdownPromise ??= (async () => {
            await closeServer(server);
            await manager.close();
            await cleanupDaemonFiles(session);
        })();
        return shutdownPromise;
    };
    server.on("connection", (socket) => {
        void handleConnection(socket, manager, shutdown);
    });
    process.once("SIGTERM", () => {
        void shutdown();
    });
    process.once("SIGINT", () => {
        void shutdown();
    });
    await new Promise((resolve, reject) => {
        const handleListenError = (error) => {
            reject(error);
        };
        server.once("error", handleListenError);
        server.listen(socketPath, () => {
            server.off("error", handleListenError);
            resolve();
        });
    });
    server.on("error", () => {
        void shutdown();
    });
    await new Promise((resolve) => {
        server.once("close", resolve);
    });
    await shutdown();
}
async function handleConnection(socket, manager, shutdown) {
    const reader = readline.createInterface({ input: socket });
    const idleTimer = setTimeout(() => {
        reader.close();
        socket.destroy();
    }, 5_000);
    const cleanup = () => {
        clearTimeout(idleTimer);
        reader.close();
    };
    socket.once("error", () => {
        cleanup();
        socket.destroy();
    });
    socket.once("close", cleanup);
    reader.once("line", (line) => {
        clearTimeout(idleTimer);
        void handleLine(line, socket, manager)
            .then(async (shouldShutdown) => {
            await endSocket(socket);
            if (shouldShutdown)
                await shutdown();
        })
            .catch(() => {
            socket.destroy();
        })
            .finally(() => {
            reader.close();
        });
    });
}
async function handleLine(line, socket, manager) {
    let request;
    try {
        request = parseRequest(line);
    }
    catch (error) {
        await writeResponse(socket, { ...formatError(error), type: "error" });
        return false;
    }
    try {
        if (request.type === "open") {
            manager.applyForwardedEnv(request.forwardedEnv);
            await writeResponse(socket, {
                data: await manager.execute("open", {
                    timeoutMs: request.timeoutMs,
                    url: request.url,
                    waitUntil: request.waitUntil,
                }),
                id: request.id,
                type: "success",
            });
            return false;
        }
        if (request.type === "command") {
            manager.applyForwardedEnv(request.forwardedEnv);
            await writeResponse(socket, {
                data: await manager.execute(request.command, request.params),
                id: request.id,
                type: "success",
            });
            return false;
        }
        if (request.type === "status") {
            await writeResponse(socket, {
                data: await manager.status(),
                id: request.id,
                type: "success",
            });
            return false;
        }
        await writeResponse(socket, {
            data: { stopped: true },
            id: request.id,
            type: "success",
        });
        return true;
    }
    catch (error) {
        await writeResponse(socket, {
            ...formatError(error),
            id: request.id,
            type: "error",
        });
        return false;
    }
}
function closeServer(server) {
    if (!server.listening)
        return Promise.resolve();
    return new Promise((resolve, reject) => {
        server.close((error) => {
            if (error) {
                reject(error);
                return;
            }
            resolve();
        });
    });
}
function writeResponse(socket, response) {
    return new Promise((resolve, reject) => {
        socket.write(serializeResponse(response), (error) => {
            if (error) {
                reject(error);
                return;
            }
            resolve();
        });
    });
}
function endSocket(socket) {
    return new Promise((resolve) => {
        socket.end(resolve);
    });
}
function formatError(error) {
    const message = error instanceof Error ? error.message : String(error);
    if (error instanceof DriverError) {
        return {
            code: error.code,
            error: message,
            ...(error.httpStatus !== undefined
                ? { httpStatus: error.httpStatus }
                : {}),
        };
    }
    return { error: message };
}
