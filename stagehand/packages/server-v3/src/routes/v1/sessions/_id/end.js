import { StatusCodes } from "http-status-codes";
import { Api } from "@browserbasehq/stagehand";
import { authMiddleware } from "../../../../lib/auth.js";
import { withErrorHandling } from "../../../../lib/errorHandler.js";
import { error } from "../../../../lib/response.js";
import { getSessionStore } from "../../../../lib/sessionStoreManager.js";
const endRouteHandler = withErrorHandling(async (request, reply) => {
    if (!(await authMiddleware(request))) {
        return error(reply, "Unauthorized", StatusCodes.UNAUTHORIZED);
    }
    // This endpoint intentionally has no request body. Reject unexpected bodies to
    // catch misconfigured clients, while still allowing empty JSON bodies.
    const body = request.body;
    if (body != null) {
        if (typeof body !== "object" || Buffer.isBuffer(body)) {
            return error(reply, "Request body must be empty", StatusCodes.BAD_REQUEST);
        }
        if (Object.keys(body).length > 0) {
            return error(reply, "Request body must be empty", StatusCodes.BAD_REQUEST);
        }
    }
    const { id: sessionId } = request.params;
    const sessionStore = getSessionStore();
    const hasSession = await sessionStore.hasSession(sessionId);
    if (!hasSession) {
        return error(reply, "Session not found", StatusCodes.NOT_FOUND);
    }
    await sessionStore.endSession(sessionId);
    return reply.status(StatusCodes.OK).send({ success: true });
});
const endRoute = {
    method: "POST",
    url: "/sessions/:id/end",
    schema: {
        ...Api.Operations.SessionEnd,
        headers: Api.SessionHeadersSchema,
        params: Api.SessionIdParamsSchema,
        response: {
            200: Api.SessionEndResponseSchema,
        },
    },
    handler: endRouteHandler,
};
export default endRoute;
