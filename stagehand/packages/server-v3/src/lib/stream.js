import { StatusCodes } from "http-status-codes";
import { v4 } from "uuid";
import { z } from "zod/v4";
import { AppError } from "./errorHandler.js";
import { getOptionalHeader, getRequestModelConfig, getStagehandInitModelConfig, shouldRespondWithSSE, } from "./header.js";
import { error, success } from "./response.js";
import { getSessionStore } from "./sessionStoreManager.js";
function formatZodIssues(err) {
    return err.issues.map((issue) => ({
        path: issue.path[0] ?? "unknown",
        message: issue.message,
    }));
}
export async function createStreamingResponse({ sessionId, request, reply, schema, handler, operation, }) {
    const shouldStreamResponse = shouldRespondWithSSE(request);
    const sessionStore = getSessionStore();
    const sessionConfig = await sessionStore.getSessionConfig(sessionId);
    const browserType = sessionConfig.browserType ?? "local";
    let browserbaseApiKey = sessionConfig.browserbaseApiKey;
    const browserbaseProjectId = sessionConfig.browserbaseProjectId;
    if (browserType === "browserbase") {
        browserbaseApiKey =
            browserbaseApiKey ?? getOptionalHeader(request, "x-bb-api-key");
        if (!browserbaseApiKey || !browserbaseProjectId) {
            return reply.status(StatusCodes.BAD_REQUEST).send({
                error: "Browserbase API key and resolved project ID are required for browserbase sessions",
            });
        }
    }
    // Parse data using V3 schema
    let parsedData;
    try {
        const json = request.body;
        parsedData = await schema.parseAsync(json);
    }
    catch (err) {
        const parseError = err;
        if (parseError instanceof z.ZodError) {
            return reply.status(StatusCodes.BAD_REQUEST).send({
                error: parseError.issues.map((issue) => ({
                    path: issue.path[0],
                    message: issue.message,
                })),
            });
        }
        return reply
            .status(StatusCodes.BAD_REQUEST)
            .send({ error: parseError.message });
    }
    if (shouldStreamResponse) {
        try {
            reply.raw.writeHead(StatusCodes.OK, {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache, no-transform",
                Connection: "keep-alive",
                "Transfer-Encoding": "chunked",
                "X-Accel-Buffering": "no",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "*",
            });
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        }
        catch (_err) {
            return error(reply, "Failed to write head", StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }
    const sendData = (event, type, data) => {
        if (!shouldStreamResponse) {
            return;
        }
        reply.raw.write(`event: ${event}\ndata: ${JSON.stringify({ data, type, id: v4() })}\n\n`);
    };
    const actionId = v4();
    sendData("starting", "system", { status: "starting" });
    const sendZodValidationError = (err) => {
        const validationIssues = formatZodIssues(err);
        if (shouldStreamResponse) {
            sendData("error", "system", {
                status: "error",
                error: validationIssues,
            });
            reply.raw.end();
            return reply;
        }
        return reply.status(StatusCodes.BAD_REQUEST).send({
            error: validationIssues,
        });
    };
    const requestModelConfigResult = getRequestModelConfig(request);
    if (requestModelConfigResult.success === false) {
        return sendZodValidationError(requestModelConfigResult.error);
    }
    const requestModelConfig = requestModelConfigResult.data;
    const stagehandInitModelConfigResult = getStagehandInitModelConfig(request, requestModelConfig);
    if (stagehandInitModelConfigResult.success === false) {
        return sendZodValidationError(stagehandInitModelConfigResult.error);
    }
    const stagehandInitModelConfig = stagehandInitModelConfigResult.data;
    const modelApiKey = requestModelConfig.apiKey;
    const parsedRequestModelConfig = stagehandInitModelConfig.model?.modelName
        ? stagehandInitModelConfig.model
        : undefined;
    const requestContext = {
        modelApiKey,
        requestModelConfig: parsedRequestModelConfig,
        logger: shouldStreamResponse
            ? (message) => {
                sendData("running", "log", { status: "running", message });
            }
            : undefined,
    };
    let stagehand;
    try {
        stagehand = (await sessionStore.getOrCreateStagehand(sessionId, requestContext));
    }
    catch (err) {
        const loadError = err instanceof Error ? err : new Error(String(err));
        sendData("error", "system", { status: "error", error: loadError.message });
        if (shouldStreamResponse) {
            reply.raw.end();
            return reply;
        }
        return error(reply, loadError.message, loadError instanceof AppError
            ? loadError.statusCode
            : StatusCodes.INTERNAL_SERVER_ERROR);
    }
    sendData("connected", "system", { status: "connected" });
    let result = null;
    let handlerError = null;
    try {
        result = await handler({ stagehand, data: parsedData });
    }
    catch (err) {
        handlerError = err instanceof Error ? err : new Error("Unknown error");
        request.log.error({
            err: handlerError,
            operation: operation ?? "operation",
            sessionId,
            browserType,
            modelName: requestModelConfig.modelName,
            hasModelApiKey: Boolean(modelApiKey),
            hasBrowserbaseApiKey: Boolean(browserbaseApiKey),
            hasBrowserbaseProjectId: Boolean(browserbaseProjectId),
        }, "operation handler failed");
    }
    if (handlerError) {
        const clientMessage = handlerError instanceof AppError
            ? handlerError.getClientMessage()
            : handlerError.message;
        sendData("error", "system", { status: "error", error: clientMessage });
        if (shouldStreamResponse) {
            reply.raw.end();
            return reply;
        }
        const statusCode = handlerError instanceof AppError
            ? handlerError.statusCode
            : StatusCodes.INTERNAL_SERVER_ERROR;
        return error(reply, clientMessage, statusCode);
    }
    sendData("finished", "system", {
        status: "finished",
        result: result?.result,
        actionId,
    });
    if (shouldStreamResponse) {
        reply.raw.end();
        return reply;
    }
    return success(reply, { result: result?.result, actionId });
}
