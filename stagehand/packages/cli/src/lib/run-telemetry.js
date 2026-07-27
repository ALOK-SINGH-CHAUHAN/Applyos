let currentRunTelemetry = {};
export function resetRunTelemetry() {
    currentRunTelemetry = {};
}
export function getRunTelemetry() {
    return currentRunTelemetry;
}
export function setRunTelemetryCompletion(completion) {
    currentRunTelemetry = {
        ...currentRunTelemetry,
        ...completion,
    };
}
