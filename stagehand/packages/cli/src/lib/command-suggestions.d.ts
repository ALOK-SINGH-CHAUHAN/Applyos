/**
 * Suggestion engine for unknown commands.
 *
 * oclif's spaced-topic parsing glues unknown leading argv tokens into the
 * attempted command id (e.g. `browse opne https://example.com` arrives as
 * `opne:https://example.com`), so the id may contain user-provided values.
 * Everything here works on a sanitized token prefix and never returns raw
 * argv content beyond the tokens that matched a known command shape.
 */
/**
 * Old Commander-era syntax (and common agent guesses) mapped to the current
 * command tree. Keys and values are colon-separated oclif ids; values may
 * also be topics (e.g. `cloud:contexts`, which prints topic help).
 */
export declare const aliasSuggestions: ReadonlyMap<string, string>;
export interface CommandSuggestion {
    /** Sanitized colon-separated tokens treated as the attempted command. */
    attempted: string;
    /** Colon-separated suggested command or topic, when a decent match exists. */
    suggestion: string | null;
}
/**
 * Extracts the leading command-shaped tokens from an attempted id, stopping
 * at the first token that does not look like a command word (URLs, selectors,
 * flags, and other argument-like values).
 */
export declare function extractCommandTokens(id: string): string[];
/**
 * Computes a suggestion for an unknown command id. Explicit aliases win over
 * fuzzy matches, and longer token prefixes win over shorter ones so that
 * `auth status` resolves before `auth`. Returns only the matched prefix as
 * `attempted` (or the first token when nothing matches) so user-provided
 * values never escape into messaging or telemetry.
 */
export declare function suggestCommand(id: string, commandIds: readonly string[]): CommandSuggestion;
