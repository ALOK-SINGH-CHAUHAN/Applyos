import type { CoreCapability, CoreTool, StartupProfile, ToolStartInput, ToolStartResult } from "../contracts/tool.js";
import type { TargetKind } from "../contracts/targets.js";
export type CdpEventMessage = {
    method: string;
    params?: Record<string, unknown>;
    sessionId?: string;
};
export declare function buildCdpEvaluationExpression<Arg>(pageFunctionOrExpression: string | ((arg: Arg) => unknown), arg?: Arg): string;
export declare class CdpConnection {
    private readonly pending;
    private readonly eventListeners;
    private readonly ws;
    private nextId;
    private closed;
    private constructor();
    static connect(input: {
        kind: "ws" | "http";
        url: string;
        headers?: Record<string, string>;
    }): Promise<CdpConnection>;
    onEvent(listener: (event: CdpEventMessage) => void): () => void;
    send<T = unknown>(method: string, params?: Record<string, unknown>, sessionId?: string): Promise<T>;
    close(): Promise<void>;
    private handleMessage;
    private rejectAll;
}
export declare class CdpCodeTool implements CoreTool {
    readonly id = "cdp_code";
    readonly surface = "code";
    readonly family = "cdp";
    readonly supportedStartupProfiles: StartupProfile[];
    readonly supportedCapabilities: CoreCapability[];
    readonly supportedTargetKinds: TargetKind[];
    start(input: ToolStartInput): Promise<ToolStartResult>;
}
