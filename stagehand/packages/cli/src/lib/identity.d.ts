/**
 * Resolve the anonymous install id, reading (or creating) the marker file.
 * Memoizes the result so repeated calls share one resolution. Reads the
 * canonical marker, forward-migrates an id from a legacy per-OS marker if one
 * exists, mints a UUID on a true miss, and swallows write failures.
 */
export declare function resolveInstallId(env: NodeJS.ProcessEnv, fallbackId?: string): Promise<string>;
/**
 * Read the install id synchronously if it has already been resolved. Returns
 * `undefined` when resolution has not completed yet — callers must not block on
 * it (e.g. cloud API headers omit the id rather than wait for disk I/O).
 */
export declare function peekInstallId(): string | undefined;
export declare function resolveInstallIdPath(env: NodeJS.ProcessEnv): string;
/**
 * The shared Browserbase config dir, matching core (`BROWSERBASE_CONFIG_DIR`)
 * and the CLI's own skills/sessions locations. Honors BROWSERBASE_CONFIG_DIR
 * when set (already includes the `browserbase` segment, e.g. `~/.config/browserbase`);
 * otherwise `(XDG_CONFIG_HOME||~/.config)/browserbase` on every platform.
 */
export declare function resolveConfigDir(env?: NodeJS.ProcessEnv): string;
/**
 * Sanitize a value for use in Browserbase `userMetadata`. The session-create
 * validator only accepts characters matching `[\w\-_,;:.()&$%#@!?~]` and
 * enforces a total length limit; this function strips everything else and
 * truncates to `max` characters (default 64) so a semver `+build` suffix or
 * any other unexpected character cannot cause a 400 on every remote session.
 */
export declare function toMetadataValue(v: string, max?: number): string;
/**
 * Seed the CLI version from oclif's `Config.version` (the single source of
 * truth). This is called once at startup from `BrowseCommand.init()` in base.ts
 * — and because every command (including the background `browse daemon` that
 * creates Browserbase sessions) extends `BrowseCommand`, the cache is populated
 * in whichever process builds a session/header. Only truthy values are stored
 * so a missing version leaves the `"unknown"` fallback intact.
 */
export declare function setCliVersion(version: string): void;
/**
 * The CLI version for non-command contexts (remote session `userMetadata`,
 * cloud API headers). It is seeded once from `Config.version` in base.ts at
 * startup via {@link setCliVersion}; this reads back the cached value with no
 * filesystem access. Falls back to `"unknown"` if it was never seeded.
 */
export declare function getCliVersion(): string;
