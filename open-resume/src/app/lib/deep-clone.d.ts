/**
 * Server side object deep clone util using JSON serialization.
 * Not efficient for large objects but good enough for most use cases.
 *
 * Client side can simply use structuredClone.
 */
export declare const deepClone: <T extends {
    [key: string]: any;
}>(object: T) => T;
