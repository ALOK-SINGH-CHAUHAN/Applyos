import type { RouteOptions } from "fastify";
/**
 * Get the current readiness state of the server
 * @returns {boolean} Whether the server is ready to accept requests
 */
export declare const getIsReady: () => boolean;
/**
 * Mark the server as ready to accept requests
 */
export declare const setReady: () => void;
/**
 * Mark the server as not ready to accept requests
 * Used during graceful shutdown to stop accepting new requests
 */
export declare const setUnready: () => void;
declare const readinessRoute: RouteOptions;
export default readinessRoute;
