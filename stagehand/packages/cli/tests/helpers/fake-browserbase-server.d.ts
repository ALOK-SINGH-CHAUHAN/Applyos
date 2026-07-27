import { type IncomingMessage, type ServerResponse } from "node:http";
export interface CapturedRequest {
    method: string;
    path: string;
    headers: IncomingMessage["headers"];
    bodyBuffer: Buffer;
    bodyText: string;
    jsonBody?: unknown;
}
export interface FakeBrowserbaseServer {
    baseUrl: string;
    requests: CapturedRequest[];
    close(): Promise<void>;
}
export declare function startFakeBrowserbaseServer(handler: (request: CapturedRequest, response: ServerResponse) => Promise<void> | void): Promise<FakeBrowserbaseServer>;
export declare function jsonResponse(response: ServerResponse, statusCode: number, body: unknown): void;
export declare function textResponse(response: ServerResponse, statusCode: number, body: string): void;
export declare function binaryResponse(response: ServerResponse, statusCode: number, body: Buffer, contentType?: string): void;
