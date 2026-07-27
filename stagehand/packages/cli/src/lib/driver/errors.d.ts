/**
 * Typed driver error. The daemon serializes `code`/`httpStatus` into error
 * responses so the client can record a telemetry result code and agents get
 * a stable, machine-readable failure reason alongside the human message.
 */
export declare class DriverError extends Error {
    readonly code: string;
    readonly httpStatus?: number;
    constructor(message: string, options: {
        cause?: unknown;
        code: string;
        httpStatus?: number;
    });
}
