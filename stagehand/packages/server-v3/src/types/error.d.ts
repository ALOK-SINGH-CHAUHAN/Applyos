import { AppError } from "../lib/errorHandler.js";
export declare class UnknownModelError extends AppError {
    constructor(model: string);
}
export declare class InvalidProviderError extends AppError {
    constructor(provider: string);
}
export declare class InvalidModelError extends AppError {
    constructor(model: string);
}
export declare class UnauthorizedError extends AppError {
    constructor();
}
export declare class MissingHeaderError extends AppError {
    constructor(header: string);
}
export declare class InvalidAPIKeyError extends AppError {
    constructor(provider: string);
}
export declare class AttemptedCloseOnNonActiveSessionError extends AppError {
    constructor();
}
export declare class BrowserbaseSDKError extends AppError {
    constructor(error: unknown, defaultMessage: string);
}
