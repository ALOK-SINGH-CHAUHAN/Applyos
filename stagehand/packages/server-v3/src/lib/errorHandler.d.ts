import type { FastifyReply, FastifyRequest, RouteGenericInterface } from "fastify";
export declare class AppError extends Error {
    statusCode: number;
    isInternal: boolean;
    constructor(message: string, statusCode?: any, isInternal?: boolean);
    /**
     * Get the message safe to send to clients.
     * For internal errors (5xx), returns generic message.
     * For client errors (4xx), returns actual message.
     */
    getClientMessage(): string;
}
/**
 * Wraps a route handler with error handling
 * @param handler The route handler to wrap
 * @returns A wrapped route handler that catches errors
 */
export declare function withErrorHandling<T extends RouteGenericInterface = RouteGenericInterface, R = unknown>(handler: (request: FastifyRequest<T>, reply: FastifyReply) => Promise<R>): (request: FastifyRequest<T>, reply: FastifyReply) => Promise<R | FastifyReply>;
