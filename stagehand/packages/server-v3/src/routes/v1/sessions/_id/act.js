import { StatusCodes } from "http-status-codes";
import { Api } from "@browserbasehq/stagehand";
import { authMiddleware } from "../../../../lib/auth.js";
import { AppError, withErrorHandling } from "../../../../lib/errorHandler.js";
import { createStreamingResponse } from "../../../../lib/stream.js";
import { getSessionStore } from "../../../../lib/sessionStoreManager.js";
const actRouteHandler = withErrorHandling(async (request, reply) => {
    if (!(await authMiddleware(request))) {
        return reply
            .status(StatusCodes.UNAUTHORIZED)
            .send({ error: "Unauthorized" });
    }
    const { id } = request.params;
    if (!id.length) {
        return reply.status(StatusCodes.BAD_REQUEST).send({
            message: "Missing session id",
        });
    }
    const sessionStore = getSessionStore();
    const hasSession = await sessionStore.hasSession(id);
    if (!hasSession) {
        return reply.status(StatusCodes.NOT_FOUND).send({
            message: "Session not found",
        });
    }
    return createStreamingResponse({
        sessionId: id,
        request,
        reply,
        schema: Api.ActRequestSchema,
        handler: async ({ stagehand, data }) => {
            const { frameId } = data;
            const page = frameId
                ? stagehand.context.resolvePageByMainFrameId(frameId)
                : await stagehand.context.awaitActivePage();
            if (!page) {
                throw new AppError("Page not found", StatusCodes.INTERNAL_SERVER_ERROR);
            }
            const modelOpt = data.options?.model;
            const normalizedModel = typeof modelOpt === "string"
                ? { modelName: modelOpt }
                : modelOpt
                    ? { ...modelOpt, modelName: modelOpt.modelName ?? "gpt-4o" }
                    : undefined;
            const safeOptions = {
                ...data.options,
                model: normalizedModel,
                page,
            };
            let result;
            if (typeof data.input === "string") {
                result = await stagehand.act(data.input, safeOptions);
            }
            else {
                result = await stagehand.act(data.input, safeOptions);
            }
            return { result };
        },
        operation: "act",
    });
});
const actRoute = {
    method: "POST",
    url: "/sessions/:id/act",
    schema: {
        ...Api.Operations.SessionAct,
        headers: Api.SessionHeadersSchema,
        params: Api.SessionIdParamsSchema,
        body: Api.ActRequestSchema,
        response: {
            200: Api.ActResponseSchema,
        },
    },
    handler: actRouteHandler,
};
export default actRoute;
