export interface ContextAlias {
    id: string;
    createdAt: string;
}
export type ContextAliasEntry = ContextAlias & {
    name: string;
};
export declare function looksLikeContextId(value: string): boolean;
export declare function isValidContextName(name: string): boolean;
export declare function contextNameRequirement(): string;
export declare function contextsStorePath(env?: NodeJS.ProcessEnv): string;
export declare function listContextAliases(env?: NodeJS.ProcessEnv): Promise<ContextAliasEntry[]>;
export declare function getContextAlias(name: string, env?: NodeJS.ProcessEnv): Promise<ContextAlias | undefined>;
export declare function saveContextAlias(name: string, alias: ContextAlias, env?: NodeJS.ProcessEnv): Promise<void>;
export declare function removeContextAlias(name: string, env?: NodeJS.ProcessEnv): Promise<boolean>;
/**
 * Drop any saved aliases that point at a given context id. Used after a delete
 * so the local map never references a context that no longer exists, regardless
 * of whether the user deleted it by name or by raw id. Returns the names pruned.
 */
export declare function removeContextAliasesById(id: string, env?: NodeJS.ProcessEnv): Promise<string[]>;
/**
 * Resolve a context reference that may be a locally-saved name or a raw
 * Browserbase context id. If `ref` matches a saved name, returns its id;
 * otherwise returns `ref` unchanged (assumed to already be a context id). Never
 * throws — an unknown ref simply passes through to the API.
 */
export declare function resolveContextRef(ref: string, env?: NodeJS.ProcessEnv): Promise<string>;
export interface ContextRefResolution {
    /** The resolved context id, or null when `ref` is an unknown name. */
    id: string | null;
    /** Saved names closest to `ref`, for a "did you mean?" hint. */
    suggestions: string[];
}
/**
 * Like `resolveContextRef`, but distinguishes "this is an unknown name" from a
 * real id so callers can show a friendly error instead of letting a typo'd name
 * hit the API as a bogus id. A ref resolves when it matches a saved name or is
 * shaped like a context id (UUID); anything else returns `id: null` plus the
 * closest saved names.
 */
export declare function resolveContextRefDetailed(ref: string, env?: NodeJS.ProcessEnv): Promise<ContextRefResolution>;
/**
 * Saved names within a small edit distance of `ref`, nearest first, for typo
 * hints. The threshold scales with name length so short names aren't matched too
 * loosely.
 */
export declare function closeContextNameMatches(ref: string, names: string[], limit?: number): string[];
