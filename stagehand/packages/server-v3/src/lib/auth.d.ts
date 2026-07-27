import type { FastifyRequest } from "fastify";
export declare const authMiddleware: (request: FastifyRequest) => Promise<boolean>;
