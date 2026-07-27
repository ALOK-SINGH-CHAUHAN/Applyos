import { isDeepStrictEqual } from "node:util";
import { fail } from "../errors.js";
import { getRemote } from "./remote-binding.js";
import { resolveWsTarget } from "./resolve-ws.js";
function resolveHeadless(flags) {
    if (flags.headed && flags.headless) {
        fail("Pass either --headed or --headless, not both.");
    }
    if (flags.headed)
        return false;
    if (flags.headless)
        return true;
    return true;
}
export function hasChromeArgFlags(flags) {
    return chromeArgFlagsInUse(flags).length > 0;
}
function chromeArgFlagsInUse(flags) {
    const names = [];
    if (flags["chrome-arg"]?.length)
        names.push("--chrome-arg");
    if (flags["ignore-default-chrome-arg"]?.length)
        names.push("--ignore-default-chrome-arg");
    if (flags["no-default-chrome-args"])
        names.push("--no-default-chrome-args");
    return names;
}
export function remoteOnlyFlagsInUse(flags) {
    const names = [];
    if (flags.verified)
        names.push("--verified");
    if (flags.proxies)
        names.push("--proxies");
    return names;
}
export async function resolveConnectionTarget(flags) {
    const chromeArgFlags = chromeArgFlagsInUse(flags);
    // --verified / --proxies configure a Browserbase session at creation time, so
    // they only mean something for an explicit --remote session. We deliberately
    // do NOT let them imply --remote: that would silently switch the user to
    // API-key (billed) cloud sessions. Require the mode to be stated explicitly.
    const remoteOnlyFlags = remoteOnlyFlagsInUse(flags);
    if (remoteOnlyFlags.length > 0 && !flags.remote) {
        const verb = remoteOnlyFlags.length === 1 ? "requires" : "require";
        fail(`${remoteOnlyFlags.join(" and ")} ${verb} --remote. Try: browse open <url> --remote ${remoteOnlyFlags.join(" ")}`);
    }
    if (flags.cdp) {
        failOnConflictingFlags("--cdp", [
            flags["auto-connect"] ? "--auto-connect" : null,
            ...chromeArgFlags,
            flags.local ? "--local" : null,
            flags.remote ? "--remote" : null,
            flags.headed ? "--headed" : null,
            flags.headless ? "--headless" : null,
        ]);
        return {
            kind: "cdp",
            endpoint: await resolveWsTarget(flags.cdp),
            targetId: flags["target-id"],
        };
    }
    if (flags["target-id"]) {
        fail("--target-id requires --cdp.");
    }
    if (flags["auto-connect"]) {
        failOnConflictingFlags("--auto-connect", [
            ...chromeArgFlags,
            flags.local ? "--local" : null,
            flags.remote ? "--remote" : null,
            flags.headed ? "--headed" : null,
            flags.headless ? "--headless" : null,
        ]);
        return { kind: "auto-connect" };
    }
    if (flags.local && flags.remote) {
        fail("Pass either --local or --remote, not both.");
    }
    if (flags.remote) {
        failOnConflictingFlags("--remote", [
            ...chromeArgFlags,
            flags.headed ? "--headed" : null,
            flags.headless ? "--headless" : null,
        ]);
        return (await getRemote()).resolveExplicitRemoteTarget(flags);
    }
    if (flags.local) {
        return managedLocalTarget(resolveHeadless(flags), resolveChromeArgs(flags));
    }
    const autoRemote = (await getRemote()).autoSelectRemoteTarget();
    if (autoRemote) {
        failOnConflictingFlags("remote mode", [
            ...chromeArgFlags,
            flags.headed ? "--headed" : null,
            flags.headless ? "--headless" : null,
        ]);
        return autoRemote;
    }
    return managedLocalTarget(resolveHeadless(flags), resolveChromeArgs(flags));
}
function managedLocalTarget(headless, chromeArgs) {
    return {
        ...(chromeArgs.args?.length ? { chromeArgs: chromeArgs.args } : {}),
        ...(chromeArgs.ignoreDefaultArgs !== undefined
            ? { ignoreDefaultArgs: chromeArgs.ignoreDefaultArgs }
            : {}),
        kind: "managed-local",
        headless,
    };
}
function failOnConflictingFlags(flag, candidates) {
    const conflicts = candidates.filter((candidate) => Boolean(candidate));
    if (conflicts.length > 0)
        fail(`${flag} cannot be combined with ${conflicts.join(", ")}.`);
}
function resolveChromeArgs(flags) {
    const args = flags["chrome-arg"]?.filter((arg) => arg.length > 0);
    const ignoreDefaults = flags["ignore-default-chrome-arg"]?.filter((arg) => arg.length > 0);
    const noDefaults = flags["no-default-chrome-args"] === true;
    if (noDefaults && ignoreDefaults?.length) {
        fail("--no-default-chrome-args cannot be combined with --ignore-default-chrome-arg.");
    }
    const resolved = {};
    if (args?.length)
        resolved.args = args;
    if (noDefaults) {
        resolved.ignoreDefaultArgs = true;
    }
    else if (ignoreDefaults?.length) {
        resolved.ignoreDefaultArgs = ignoreDefaults;
    }
    return resolved;
}
export function targetsCompatible(left, right) {
    if (left.kind !== right.kind)
        return false;
    if (left.kind === "managed-local" && right.kind === "managed-local")
        return (left.headless === right.headless &&
            chromeArgsEqual(left.chromeArgs, right.chromeArgs) &&
            ignoreDefaultArgsEqual(left.ignoreDefaultArgs, right.ignoreDefaultArgs));
    if (left.kind === "cdp" && right.kind === "cdp") {
        return left.endpoint === right.endpoint && left.targetId === right.targetId;
    }
    if (left.kind === "remote" && right.kind === "remote") {
        // verified/proxies are baked in at session creation, so a re-open that asks
        // for different settings can't reuse the running session — make them sticky
        // like headless, forcing an explicit stop-and-reopen.
        return (Boolean(left.verified) === Boolean(right.verified) &&
            Boolean(left.proxies) === Boolean(right.proxies));
    }
    return true;
}
function chromeArgsEqual(left, right) {
    return isDeepStrictEqual(left ?? [], right ?? []);
}
function ignoreDefaultArgsEqual(left, right) {
    if (left === true || right === true)
        return left === right;
    return chromeArgsEqual(Array.isArray(left) ? left : undefined, Array.isArray(right) ? right : undefined);
}
