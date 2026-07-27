import { createHash } from "node:crypto";
import { getRemote } from "../remote-binding.js";
/** Collect the forwardable env vars that are set in the caller's env. */
export async function collectForwardedEnv(env = process.env) {
    const keys = (await getRemote()).forwardedEnvKeys();
    const forwardedEnv = {};
    for (const key of keys) {
        const value = env[key];
        if (typeof value === "string" && value.length > 0) {
            forwardedEnv[key] = value;
        }
    }
    return Object.keys(forwardedEnv).length > 0 ? forwardedEnv : undefined;
}
/**
 * Stable, secret-free fingerprint of a forwarded env set, used only to
 * detect whether the caller's forwarded env changed between requests (so a cold
 * session can bust its cached init-failure backoff and retry with the new key).
 * Hashing keeps the raw key out of any retained field. Iterates the received
 * object's own keys — the client already filtered to the forwardable set — so
 * this carries no literal key names. Returns "" for an empty/absent set.
 */
export function forwardedEnvSignature(forwardedEnv) {
    if (!forwardedEnv)
        return "";
    const entries = Object.entries(forwardedEnv)
        .filter(([, value]) => typeof value === "string" && value.length > 0)
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    if (entries.length === 0)
        return "";
    const hash = createHash("sha256");
    for (const [key, value] of entries) {
        hash.update(key);
        hash.update("\0");
        hash.update(value);
        hash.update("\0");
    }
    return hash.digest("hex");
}
