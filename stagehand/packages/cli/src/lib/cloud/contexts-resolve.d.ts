/**
 * Resolve a context name-or-id for a command. A saved name or a context id
 * resolves to its id. When a ref is neither but is close to a saved name, we
 * treat it as a typo and fail with a "did you mean?" hint instead of sending a
 * bogus id. Otherwise we pass the ref through unchanged so raw ids of any shape
 * still reach the API — preserving raw-id compatibility.
 */
export declare function resolveContextRefOrFail(ref: string): Promise<string>;
