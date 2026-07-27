import { StatusCodes } from "http-status-codes";
export function success(reply, data, status = StatusCodes.OK) {
    return reply.status(status).send({
        success: true,
        data,
    });
}
export function error(reply, message, status = StatusCodes.BAD_REQUEST) {
    return reply.status(status).send({
        success: false,
        message,
    });
}
export function isSuccessResponse(response) {
    return response.success;
}
export function isErrorResponse(response) {
    return !response.success;
}
