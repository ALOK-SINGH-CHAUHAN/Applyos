import { StatusCodes } from "http-status-codes";
import { z } from "zod/v4";
import { withErrorHandling } from "../lib/errorHandler.js";
// Server readiness state management
let isReady = false;
/**
 * Get the current readiness state of the server
 * @returns {boolean} Whether the server is ready to accept requests
 */
export const getIsReady = () => {
    return isReady;
};
/**
 * Mark the server as ready to accept requests
 */
export const setReady = () => {
    isReady = true;
};
/**
 * Mark the server as not ready to accept requests
 * Used during graceful shutdown to stop accepting new requests
 */
export const setUnready = () => {
    isReady = false;
};
const readinessRoute = {
    method: "GET",
    url: "/readyz",
    logLevel: "silent",
    schema: {
        hide: true, // Hide from OpenAPI spec - utility endpoint
        response: {
            200: z.string(),
            503: z.string(),
        },
    },
    handler: withErrorHandling(async (_request, reply) => {
        if (!isReady) {
            return reply
                .code(StatusCodes.SERVICE_UNAVAILABLE)
                .send("Service Unavailable");
        }
        return reply.code(StatusCodes.OK).send("Ready");
    }),
};
export default readinessRoute;
