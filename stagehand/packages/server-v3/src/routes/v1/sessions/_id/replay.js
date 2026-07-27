import { StatusCodes } from "http-status-codes";
import { Api } from "@browserbasehq/stagehand";
import { authMiddleware } from "../../../../lib/auth.js";
import { withErrorHandling } from "../../../../lib/errorHandler.js";
import { error, success } from "../../../../lib/response.js";
const replayRouteHandler = withErrorHandling(async (request, reply) => {
    if (!(await authMiddleware(request))) {
        return error(reply, "Unauthorized", StatusCodes.UNAUTHORIZED);
    }
    reply.log.warn("Replay endpoint not implemented for local server.");
    const replay = {
        pages: [],
    };
    return success(reply, replay);
});
const replayRoute = {
    method: "GET",
    url: "/sessions/:id/replay",
    schema: {
        ...Api.Operations.SessionReplay,
        headers: Api.SessionHeadersSchema,
        params: Api.SessionIdParamsSchema,
        response: {
            200: Api.ReplayResponseSchema,
        },
    },
    handler: replayRouteHandler,
};
export default replayRoute;
