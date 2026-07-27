import { Flags } from "@oclif/core";
import { autoConnectFlag, cdpFlag, chromeArgFlag, headedFlag, headlessFlag, ignoreDefaultChromeArgFlag, localFlag, noDefaultChromeArgsFlag, proxiesFlag, remoteFlag, sessionFlag, sessionName, targetIdFlag, verifiedFlag, } from "./flags.js";
import { getDriverStatus } from "./daemon/client.js";
import { hasChromeArgFlags, resolveConnectionTarget, } from "./mode.js";
import { outputJson } from "../output.js";
import { runDriverCommandWithTarget } from "./runtime.js";
export const driverCommandFlags = {
    "auto-connect": autoConnectFlag,
    cdp: cdpFlag,
    "chrome-arg": chromeArgFlag,
    headed: headedFlag,
    headless: headlessFlag,
    "ignore-default-chrome-arg": ignoreDefaultChromeArgFlag,
    local: localFlag,
    "no-default-chrome-args": noDefaultChromeArgsFlag,
    proxies: proxiesFlag,
    remote: remoteFlag,
    session: sessionFlag,
    "target-id": targetIdFlag,
    verified: verifiedFlag,
};
export const waitUntilFlag = Flags.string({
    default: "load",
    description: "Load state to wait for before returning.",
    helpValue: "<state>",
    options: ["load", "domcontentloaded", "networkidle"],
});
export const timeoutMsFlag = Flags.integer({
    default: 30_000,
    description: "Timeout in milliseconds.",
    helpValue: "<ms>",
});
export const buttonFlag = Flags.string({
    default: "left",
    description: "Mouse button to use.",
    helpValue: "<button>",
    options: ["left", "middle", "right"],
});
export async function runDriverCommandFromFlags(command, params, flags) {
    const session = sessionName(flags.session);
    const target = await resolveTargetForCommand(session, flags);
    outputJson(await runDriverCommandWithTarget(session, target, command, params));
}
export async function resolveTargetForCommand(session, flags) {
    const hasExplicitTarget = hasExplicitDriverTarget(flags);
    if (!hasExplicitTarget || hasModeOnlyFlag(flags)) {
        const status = await getDriverStatus(session);
        if (status?.target &&
            (!hasExplicitTarget || targetMatchesRequestedMode(status.target, flags))) {
            return status.target;
        }
    }
    return resolveConnectionTarget(flags);
}
export function hasExplicitDriverTarget(flags) {
    return Boolean(flags.local ||
        flags.remote ||
        flags["auto-connect"] ||
        flags.cdp ||
        hasChromeArgFlags(flags) ||
        flags["target-id"] ||
        flags.headed ||
        flags.headless ||
        flags.verified ||
        flags.proxies);
}
function hasModeOnlyFlag(flags) {
    return Boolean((flags.local || flags.remote) &&
        !flags["auto-connect"] &&
        !flags.cdp &&
        !hasChromeArgFlags(flags) &&
        !flags["target-id"] &&
        !flags.headed &&
        !flags.headless &&
        !flags.verified &&
        !flags.proxies &&
        flags.local !== flags.remote);
}
function targetMatchesRequestedMode(target, flags) {
    if (flags.local)
        return target.kind === "managed-local";
    if (flags.remote)
        return target.kind === "remote";
    return false;
}
export function parseClip(value) {
    if (!value)
        return undefined;
    const match = value.match(/^(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),(\d+(?:\.\d+)?),(\d+(?:\.\d+)?)$/);
    if (!match) {
        throw new Error("Invalid clip. Use x,y,width,height, for example 0,0,800,600.");
    }
    const [, x, y, width, height] = match;
    return {
        height: Number.parseFloat(height),
        width: Number.parseFloat(width),
        x: Number.parseFloat(x),
        y: Number.parseFloat(y),
    };
}
export function parseNumber(value, name) {
    const number = Number(value);
    if (!Number.isFinite(number)) {
        throw new Error(`${name} must be a number.`);
    }
    return number;
}
export function parseInteger(value, name) {
    const number = parseNumber(value, name);
    if (!Number.isInteger(number)) {
        throw new Error(`${name} must be an integer.`);
    }
    return number;
}
