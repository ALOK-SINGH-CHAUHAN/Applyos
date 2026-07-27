import type { Logger } from "../types/public/index.js";
import { Page } from "../understudy/page.js";
export declare function cloneForCache<T>(value: T): T;
export declare function safeGetPageUrl(page: Page): Promise<string>;
/**
 * Normalizes a URL for use in cache key derivation: parses the URL and
 * sorts its query parameters so that equivalent URLs that differ only in
 * parameter order produce the same cache key. Returns the input unchanged
 * if it isn't a parseable URL (e.g. empty string, `about:blank`).
 */
export declare function normalizeUrlForCacheKey(rawUrl: string): string;
/**
 * Waits for a cached action's selector to be attached to the DOM before executing.
 * Logs a warning and proceeds if the wait times out (non-blocking).
 */
export declare function waitForCachedSelector(params: {
    page: Page;
    selector: string | undefined;
    timeout: number | undefined;
    logger: Logger;
    context?: string;
}): Promise<void>;
