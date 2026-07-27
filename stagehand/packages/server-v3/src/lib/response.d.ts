import type { FastifyReply } from "fastify";
interface SuccessResponse<T> {
    success: true;
    data: T;
}
interface ErrorResponse {
    success: false;
    message: string;
}
type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;
export declare function success<T>(reply: FastifyReply, data: T, status?: any): FastifyReply;
export declare function error(reply: FastifyReply, message: string, status?: any): FastifyReply;
export declare function isSuccessResponse<T>(response: ApiResponse<T>): response is SuccessResponse<T>;
export declare function isErrorResponse(response: ApiResponse<unknown>): response is ErrorResponse;
export {};
