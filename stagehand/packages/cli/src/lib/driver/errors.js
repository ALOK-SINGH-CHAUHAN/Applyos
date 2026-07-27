/**
 * Typed driver error. The daemon serializes `code`/`httpStatus` into error
 * responses so the client can record a telemetry result code and agents get
 * a stable, machine-readable failure reason alongside the human message.
 */
export class DriverError extends Error {
    code;
    httpStatus;
    constructor(message, options) {
        super(message, options.cause === undefined ? {} : { cause: options.cause });
        this.name = "DriverError";
        this.code = options.code;
        if (options.httpStatus !== undefined)
            this.httpStatus = options.httpStatus;
    }
}
