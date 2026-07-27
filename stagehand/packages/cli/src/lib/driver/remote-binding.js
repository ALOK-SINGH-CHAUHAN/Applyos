let cached;
/**
 * Load the Browserbase capability. The full build ships `remote.js`; the
 * local-only build omits it, so we fall back to `remote.disabled.js`. The full
 * specifier is held in a variable so the local-only TypeScript program can
 * exclude `remote.ts` without the compiler eagerly pulling it back in.
 */
export async function getRemote() {
    if (cached)
        return cached;
    const fullModule = "./remote.js";
    try {
        cached = (await import(fullModule));
    }
    catch (error) {
        // The full build ships remote.js; the local-only build omits it. Only fall
        // back to the disabled stub when the module is genuinely absent — rethrow
        // any other error so a real failure inside remote.ts isn't masked as
        // "remote disabled".
        const code = error?.code;
        if (code !== "ERR_MODULE_NOT_FOUND" && code !== "MODULE_NOT_FOUND") {
            throw error;
        }
        cached = (await import("./remote.disabled.js"));
    }
    return cached;
}
