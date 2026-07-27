import Browserbase, { APIConnectionError, APIConnectionTimeoutError, APIError, } from "@browserbasehq/sdk";
import { constants, createReadStream } from "node:fs";
import { access, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { Readable } from "node:stream";
import { CommandFailure, fail } from "../errors.js";
import { getCliVersion, peekInstallId, resolveInstallId } from "../identity.js";
import { setRunTelemetryCompletion } from "../run-telemetry.js";
export { outputJson } from "../output.js";
const defaultBrowserbaseApiUrl = "https://api.browserbase.com";
const browserbaseSettingsUrl = "https://browserbase.com/settings";
// Kick off install-id resolution at module load so the value is usually cached
// by the time a cloud request runs. Resolution is best-effort and never throws.
void resolveInstallId(process.env).catch(() => undefined);
/**
 * Attribution headers stamped onto cloud (Search/Fetch) requests so CLI usage
 * is attributable to an install. `x-bb-client` is always sent;
 * `x-bb-install-id` is included only when already resolved (we never block a
 * request on disk I/O) and never sent as an empty string.
 */
function attributionHeaders() {
    const headers = {
        "x-bb-client": `browse-cli/${getCliVersion()}`,
    };
    const installId = peekInstallId();
    if (installId) {
        headers["x-bb-install-id"] = installId;
    }
    return headers;
}
export function resolveApiKey(args) {
    const apiKey = args.apiKey ?? process.env.BROWSERBASE_API_KEY;
    return (apiKey ||
        fail([
            "Missing Browserbase API key. Cloud commands (search, fetch, sessions, functions, ...) need one.",
            "Set BROWSERBASE_API_KEY or pass --api-key.",
            `Get a key at ${browserbaseSettingsUrl}.`,
            "",
            "No key? Local browser automation needs none. Try: browse open <url> --local",
        ].join("\n"), 1, {
            resultCode: "missing_api_key",
            requestHadHttpResponse: false,
        }));
}
export function resolveBaseUrl(args) {
    return args.baseUrl ?? process.env.BROWSERBASE_BASE_URL;
}
export function resolveApiBaseUrl(args) {
    return resolveBaseUrl(args) ?? defaultBrowserbaseApiUrl;
}
export function createBrowserbaseClient(args) {
    return new Browserbase({
        apiKey: resolveApiKey(args),
        baseURL: resolveBaseUrl(args),
        defaultHeaders: attributionHeaders(),
    });
}
export async function withBrowserbaseApi(command, operation) {
    try {
        return await operation();
    }
    catch (error) {
        rethrowBrowserbaseApiError(error, command);
    }
}
export function parseOptionalJsonObjectArg(rawValue, label) {
    if (!rawValue) {
        return {};
    }
    if (typeof rawValue !== "string") {
        fail(`${label} must be provided as a JSON string.`);
    }
    let parsed;
    try {
        parsed = JSON.parse(rawValue);
    }
    catch (error) {
        fail(`Invalid JSON for ${label}: ${error.message}`);
    }
    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
        fail(`${label} must be a JSON object.`);
    }
    return parsed;
}
export async function resolveUploadableFile(filePath, label) {
    const absolutePath = resolve(filePath);
    try {
        await access(absolutePath, constants.R_OK);
    }
    catch {
        fail(`Could not read ${label} file: ${absolutePath}`);
    }
    return createReadStream(absolutePath);
}
export async function readBrowserbaseError(response) {
    let text;
    try {
        text = await response.text();
    }
    catch {
        return `${response.status} ${response.statusText}`;
    }
    if (!text) {
        return `${response.status} ${response.statusText}`;
    }
    try {
        const data = JSON.parse(text);
        if (typeof data === "object" && data !== null) {
            const message = data.message ||
                data.error;
            if (message) {
                return message;
            }
        }
    }
    catch {
        return text;
    }
    return `${response.status} ${response.statusText}`;
}
export async function requestBrowserbase(args, pathname, init = {}) {
    let response;
    try {
        response = await fetch(new URL(pathname, resolveApiBaseUrl(args)), {
            ...init,
            headers: {
                "x-bb-api-key": resolveApiKey(args),
                ...attributionHeaders(),
                ...(init.headers ?? {}),
            },
        });
    }
    catch (error) {
        if (error instanceof CommandFailure) {
            throw error;
        }
        fail(error instanceof Error ? error.message : String(error), 1, {
            resultCode: "request_no_response",
            requestHadHttpResponse: false,
        });
    }
    setRunTelemetryCompletion({
        httpStatus: response.status,
        requestHadHttpResponse: true,
    });
    if (!response.ok) {
        fail(await readBrowserbaseError(response), 1, {
            resultCode: classifyBrowserbaseHttpFailure(pathname, response.status),
            httpStatus: response.status,
            requestHadHttpResponse: true,
        });
    }
    return response;
}
export async function requestBrowserbaseJson(args, pathname, init = {}) {
    const response = await requestBrowserbase(args, pathname, init);
    return (await response.json());
}
export async function writeOutputFile(pathname, contents) {
    const absolutePath = resolve(pathname);
    try {
        await mkdir(dirname(absolutePath), { recursive: true });
        await writeFile(absolutePath, contents, "utf8");
    }
    catch (error) {
        fail(error instanceof Error ? error.message : String(error), 1, {
            resultCode: "output_write_error",
        });
    }
}
export async function writeBinaryOutput(pathname, contents) {
    const absolutePath = resolve(pathname);
    try {
        await mkdir(dirname(absolutePath), { recursive: true });
        await writeFile(absolutePath, contents);
    }
    catch (error) {
        fail(error instanceof Error ? error.message : String(error), 1, {
            resultCode: "output_write_error",
        });
    }
}
export async function readStdin() {
    if (process.stdin.isTTY) {
        fail('--stdin requires piped input. Example: echo \'{"key":"value"}\' | browse cloud <command> --stdin');
    }
    const chunks = [];
    for await (const chunk of Readable.toWeb(process.stdin)) {
        chunks.push(Buffer.from(chunk));
    }
    return Buffer.concat(chunks).toString("utf8").trim();
}
export async function resolveBody(options) {
    if (options.body && options.stdin) {
        fail("Cannot use both --body and --stdin. Provide one or the other.");
    }
    if (options.stdin) {
        const input = await readStdin();
        return parseOptionalJsonObjectArg(input, "stdin");
    }
    return parseOptionalJsonObjectArg(options.body, "body");
}
export function deepMerge(base, override) {
    const result = { ...base };
    for (const key of Object.keys(override)) {
        const baseValue = result[key];
        const overrideValue = override[key];
        if (baseValue &&
            overrideValue &&
            typeof baseValue === "object" &&
            typeof overrideValue === "object" &&
            !Array.isArray(baseValue) &&
            !Array.isArray(overrideValue)) {
            result[key] = deepMerge(baseValue, overrideValue);
        }
        else {
            result[key] = overrideValue;
        }
    }
    return result;
}
function rethrowBrowserbaseApiError(error, command) {
    if (error instanceof CommandFailure) {
        throw error;
    }
    if (error instanceof APIConnectionTimeoutError ||
        error instanceof APIConnectionError) {
        fail(error.message, 1, {
            resultCode: "request_no_response",
            requestHadHttpResponse: false,
        });
    }
    if (error instanceof APIError) {
        fail(error.message || `${command} request failed`, 1, {
            resultCode: classifyCommandHttpFailure(command, error.status),
            httpStatus: error.status,
            requestHadHttpResponse: true,
        });
    }
    throw error;
}
function classifyBrowserbaseHttpFailure(pathname, status) {
    const command = resolveCommandFromPathname(pathname);
    if (!command) {
        return status === 401 ? "auth_401" : undefined;
    }
    return classifyCommandHttpFailure(command, status);
}
export function classifyCommandHttpFailure(command, status) {
    if (status === undefined) {
        return undefined;
    }
    if (status === 401) {
        return "auth_401";
    }
    if (command === "fetch") {
        if (status === 429) {
            return "fetch_concurrency_limit";
        }
        return classifyGenericCommandHttpFailure(command, status);
    }
    if (command === "search") {
        if (status === 400 || status === 422) {
            return "search_invalid_request";
        }
        if (status === 402) {
            return "search_quota_exceeded";
        }
        if (status === 403) {
            return "search_feature_disabled";
        }
        return classifyGenericCommandHttpFailure(command, status);
    }
    return classifyGenericCommandHttpFailure(command, status);
}
function classifyGenericCommandHttpFailure(command, status) {
    if (status === 400) {
        return `${command}_bad_request`;
    }
    if (status === 402) {
        return `${command}_payment_required`;
    }
    if (status === 403) {
        return `${command}_forbidden`;
    }
    if (status === 404) {
        return `${command}_not_found`;
    }
    if (status === 409) {
        return `${command}_conflict`;
    }
    if (status === 410) {
        return `${command}_gone`;
    }
    if (status === 413) {
        return `${command}_request_too_large`;
    }
    if (status === 415) {
        return `${command}_unsupported_media_type`;
    }
    if (status === 422) {
        return `${command}_invalid_request`;
    }
    if (status === 429) {
        return `${command}_rate_limited`;
    }
    if (status === 500) {
        return `${command}_internal_error`;
    }
    if (status === 502) {
        return `${command}_bad_gateway`;
    }
    if (status === 503) {
        return `${command}_service_unavailable`;
    }
    if (status === 504) {
        return `${command}_timeout`;
    }
    return `${command}_http_${status}`;
}
function resolveCommandFromPathname(pathname) {
    if (pathname === "/v1/search") {
        return "search";
    }
    if (pathname.startsWith("/v1/contexts")) {
        return "contexts";
    }
    if (pathname.startsWith("/v1/extensions")) {
        return "extensions";
    }
    if (pathname.startsWith("/v1/functions")) {
        return "functions";
    }
    return undefined;
}
