export class CommandFailure extends Error {
    exitCode;
    telemetry;
    constructor(message, exitCode = 1, telemetry = {}) {
        super(message);
        this.name = "CommandFailure";
        this.exitCode = exitCode;
        this.telemetry = telemetry;
    }
}
export function fail(message, exitCode = 1, telemetry = {}) {
    throw new CommandFailure(message, exitCode, telemetry);
}
