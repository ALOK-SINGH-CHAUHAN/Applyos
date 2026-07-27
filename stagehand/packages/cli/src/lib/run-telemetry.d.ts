export interface RunTelemetryState {
    resultCode?: string;
    httpStatus?: number;
    requestHadHttpResponse?: boolean;
    skillId?: string;
}
export declare function resetRunTelemetry(): void;
export declare function getRunTelemetry(): RunTelemetryState;
export declare function setRunTelemetryCompletion(completion: Partial<RunTelemetryState>): void;
