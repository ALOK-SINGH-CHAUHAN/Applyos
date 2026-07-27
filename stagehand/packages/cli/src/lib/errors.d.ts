export interface CommandFailureTelemetry {
    resultCode?: string;
    httpStatus?: number;
    requestHadHttpResponse?: boolean;
}
export declare class CommandFailure extends Error {
    readonly exitCode: number;
    readonly telemetry: CommandFailureTelemetry;
    constructor(message: string, exitCode?: number, telemetry?: CommandFailureTelemetry);
}
export declare function fail(message: string, exitCode?: number, telemetry?: CommandFailureTelemetry): never;
