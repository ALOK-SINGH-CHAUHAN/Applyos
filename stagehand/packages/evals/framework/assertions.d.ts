import type { AssertHelpers } from "./types.js";
export declare class AssertionError extends Error {
    actual: unknown;
    expected: unknown;
    constructor(message: string, actual?: unknown, expected?: unknown);
}
export declare function createAssertHelpers(): AssertHelpers;
