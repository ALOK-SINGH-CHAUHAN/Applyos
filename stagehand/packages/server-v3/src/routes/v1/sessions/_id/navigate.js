import { StatusCodes } from "http-status-codes";
import { Api } from "@browserbasehq/stagehand";
import { authMiddleware } from "../../../../lib/auth.js";
import { AppError, withErrorHandling } from "../../../../lib/errorHandler.js";
import { createStreamingResponse } from "../../../../lib/stream.js";
import { getSessionStore } from "../../../../lib/sessionStoreManager.js";
const navigateRouteHandler = withErrorHandling(async (request, reply) => {
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
        schema: Api.NavigateRequestSchema,
        handler: async ({ stagehand, data }) => {
            const page = data.frameId
                ? stagehand.context.resolvePageByMainFrameId(data.frameId)
                : await stagehand.context.awaitActivePage();
            if (!page) {
                throw new AppError("Page not found", StatusCodes.NOT_FOUND);
            }
            const { timeout, ...restOptions } = data.options ?? {};
            const gotoOptions = {
                ...restOptions,
                ...(timeout === undefined ? {} : { timeoutMs: timeout }),
            };
            const result = await page.goto(data.url, gotoOptions);
            return { result };
        },
        operation: "navigate",
    });
});
const navigateRoute = {
    method: "POST",
    url: "/sessions/:id/navigate",
    schema: {
        ...Api.Operations.SessionNavigate,
        headers: Api.SessionHeadersSchema,
        params: Api.SessionIdParamsSchema,
        body: Api.NavigateRequestSchema,
        response: {
            200: Api.NavigateResponseSchema,
        },
    },
    handler: navigateRouteHandler,
};
export default navigateRoute;
