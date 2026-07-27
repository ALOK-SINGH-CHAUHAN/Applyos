export declare const HTTP_OK = 200;
export declare const HTTP_BAD_REQUEST = 400;
export declare const HTTP_NOT_FOUND = 404;
export declare const HTTP_GONE = 410;
export declare const HTTP_UNPROCESSABLE_ENTITY = 422;
export declare const HTTP_INTERNAL_SERVER_ERROR = 500;
export declare const SESSION_CLOSE_WAIT_MS = 2000;
export declare const STAGEHAND_BASE_URL: string | undefined, STAGEHAND_API_URL: string | undefined, OPENAI_API_KEY: string | undefined, GEMINI_API_KEY: string | undefined, ANTHROPIC_API_KEY: string | undefined;
export declare function requireEnv(name: string, value: string | undefined): string;
export declare function getBaseUrl(): string;
export declare function getHeaders(sdkVersion: string, language?: string): Record<string, string>;
export interface StartSessionResponse {
    success: boolean;
    message?: string;
    data?: {
        sessionId: string;
        cdpUrl: string;
        available: boolean;
    };
}
export interface SessionInfo {
    sessionId: string;
    cdpUrl: string;
}
export declare const LOCAL_BROWSER_BODY: {
    browser: {
        type: string;
        launchOptions: {
            headless: boolean;
            executablePath: string;
            args: string[] | undefined;
            connectTimeoutMs: number;
        };
    };
};
export declare function createSession(headers: Record<string, string>): Promise<string>;
export declare function createSessionWithCdp(headers: Record<string, string>): Promise<SessionInfo>;
export declare function endSession(sessionId: string, headers: Record<string, string>): Promise<void>;
export declare function navigateSession(sessionId: string, targetUrl: string, headers: Record<string, string>): Promise<Response>;
/**
 * Gets the main frame ID from a CDP session
 */
export declare function getMainFrameId(cdpUrl: string): Promise<string>;
export interface SSEEvent {
    event?: string;
    data?: string;
    parsed?: unknown;
}
export declare function readSSEStream(response: Response): Promise<SSEEvent[]>;
export interface TypedSSEEvent<TResult = unknown> {
    data: {
        status: string;
        result?: TResult;
        message?: string;
        error?: string;
    };
    type: string;
    id: string;
}
/**
 * Read SSE stream from response and return raw string
 */
export declare function readSSEStreamRaw(response: Response): Promise<string>;
/**
 * Parse raw SSE response string into typed events
 */
export declare function parseTypedSSEEvents<TResult = unknown>(rawResponse: string): TypedSSEEvent<TResult>[];
/**
 * Result of reading an SSE stream with full context for debugging
 */
export interface SSEStreamResult<TResult = unknown> {
    /** HTTP status code */
    status: number;
    /** HTTP status text */
    statusText: string;
    /** Raw response body */
    raw: string;
    /** Parsed SSE events */
    events: TypedSSEEvent<TResult>[];
    /** Get debug summary for error messages */
    debugSummary(): string;
}
/**
 * Read SSE stream and parse into typed events (legacy - no debug context)
 */
export declare function readTypedSSEStream<TResult = unknown>(response: Response): Promise<TypedSSEEvent<TResult>[]>;
/**
 * Read SSE stream with full context for debugging test failures.
 * Use this instead of readTypedSSEStream when you need better error messages.
 */
export declare function readTypedSSEStreamWithContext<TResult = unknown>(response: Response): Promise<SSEStreamResult<TResult>>;
/**
 * Assert with debug context - includes SSE stream info on failure
 */
export declare function assertWithContext(condition: boolean, message: string, context: SSEStreamResult<unknown>): asserts condition;
/**
 * Assert SSE event exists with debug context on failure, returns the found event
 */
export declare function assertEventExists<TResult>(events: TypedSSEEvent<TResult>[], status: string, context: SSEStreamResult<TResult>): TypedSSEEvent<TResult>;
/**
 * Assert HTTP status with debug context on failure
 */
export declare function assertHttpStatus(context: SSEStreamResult<unknown>, expectedStatus: number, message?: string): void;
/**
 * Result of a fetch request with full context for debugging
 */
export interface FetchResult<T = unknown> {
    /** HTTP status code */
    status: number;
    /** HTTP status text */
    statusText: string;
    /** Parsed JSON body (if parseable) */
    body: T | null;
    /** Raw response text */
    raw: string;
    /** Request duration in ms */
    durationMs: number;
    /** Response headers */
    headers: Headers;
    /** Get debug summary for error messages */
    debugSummary(): string;
}
/**
 * Fetch with full context for debugging test failures.
 * Captures timing, status, and response body.
 */
export declare function fetchWithContext<T = unknown>(url: string, options: RequestInit): Promise<FetchResult<T>>;
/**
 * Assert with fetch context - includes response info on failure
 */
export declare function assertFetchOk<T>(condition: boolean, message: string, context: FetchResult<T>): asserts condition;
/**
 * Assert fetch succeeded with expected status
 */
export declare function assertFetchStatus<T>(context: FetchResult<T>, expectedStatus: number, message?: string): void;
export declare class TestSession {
    sessionId: string | null;
    private headers;
    constructor(headers: Record<string, string>);
    start(): Promise<string>;
    navigate(targetUrl: string): Promise<Response>;
    end(): Promise<void>;
    getSessionId(): string;
}
