import type { RemoteCapability } from "./remote-types.js";
/**
 * Load the Browserbase capability. The full build ships `remote.js`; the
 * local-only build omits it, so we fall back to `remote.disabled.js`. The full
 * specifier is held in a variable so the local-only TypeScript program can
 * exclude `remote.ts` without the compiler eagerly pulling it back in.
 */
export declare function getRemote(): Promise<RemoteCapability>;
