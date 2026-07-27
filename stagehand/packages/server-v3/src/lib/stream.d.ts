import type { FastifyReply, FastifyRequest } from "fastify";
import type { Stagehand as V3Stagehand } from "@browserbasehq/stagehand";
import { z } from "zod/v4";
interface StreamingResponseOptions<TV3> {
    sessionId: string;
    request: FastifyRequest;
    reply: FastifyReply;
    schema: z.ZodType<TV3>;
    handler: (ctx: {
        stagehand: V3Stagehand;
        data: TV3;
    }) => Promise<{
        result: unknown;
        actionId?: string;
    }>;
    operation?: string;
}
export declare function createStreamingResponse<TV3>({ sessionId, request, reply, schema, handler, operation, }: StreamingResponseOptions<TV3>): Promise<any>;
export {};
