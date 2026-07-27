import { StagehandInvalidArgumentError } from "../types/public/sdkErrors.js";
const DOMAIN_LABEL_RE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const HTTP_SCHEMES = ["http", "https"];
function canonicalizeHostname(hostname) {
    return hostname.toLowerCase().replace(/\.+$/, "");
}
function validateHostname(hostname, original, kind) {
    const label = kind === "allowedDomains" ? "allowed" : "blocked";
    if (!hostname || hostname.length > 253) {
        throw new StagehandInvalidArgumentError(`Invalid ${label} domain pattern: "${original}"`);
    }
    const labels = hostname.split(".");
    if (labels.length < 2 ||
        labels.some((label) => !DOMAIN_LABEL_RE.test(label))) {
        throw new StagehandInvalidArgumentError(`Invalid ${label} domain pattern: "${original}"`);
    }
}
function normalizeDomainPattern(pattern, kind) {
    const label = kind === "allowedDomains" ? "allowed" : "blocked";
    const capitalizedLabel = kind === "allowedDomains" ? "Allowed" : "Blocked";
    if (typeof pattern !== "string") {
        throw new StagehandInvalidArgumentError(`${capitalizedLabel} domain patterns must be strings`);
    }
    const original = pattern;
    const normalized = canonicalizeHostname(pattern.trim());
    if (!normalized) {
        throw new StagehandInvalidArgumentError(`Invalid ${label} domain pattern: "${original}"`);
    }
    if (normalized.includes("://") ||
        normalized.includes("/") ||
        normalized.includes(":") ||
        normalized.includes("?") ||
        normalized.includes("#")) {
        throw new StagehandInvalidArgumentError(`${capitalizedLabel} domain patterns must be domain-only values: "${original}"`);
    }
    if (normalized.startsWith("*.")) {
        const hostname = normalized.slice(2);
        validateHostname(hostname, original, kind);
        return { type: "wildcard", hostname };
    }
    if (normalized.includes("*")) {
        throw new StagehandInvalidArgumentError(`Wildcards are only supported as a leading "*.": "${original}"`);
    }
    validateHostname(normalized, original, kind);
    return { type: "exact", hostname: normalized };
}
function normalizeDomainPatterns(patterns, kind) {
    if (!patterns?.length)
        return [];
    const rulesByKey = new Map();
    for (const pattern of patterns) {
        const rule = normalizeDomainPattern(pattern, kind);
        rulesByKey.set(`${rule.type}:${rule.hostname}`, rule);
    }
    return Array.from(rulesByKey.values());
}
function getDomainPatterns(policy, key) {
    if (policy === null)
        return [];
    // Passing undefined usually means the caller accidentally omitted the policy
    // argument or passed through an unset variable. Clearing must be explicit.
    if (policy === undefined) {
        throw new StagehandInvalidArgumentError("Domain policy must be an object or null");
    }
    const patterns = policy[key];
    if (patterns === undefined)
        return [];
    // Empty arrays intentionally clear that side of the policy, but malformed
    // runtime values should fail fast rather than silently disabling interception.
    if (!Array.isArray(patterns)) {
        throw new StagehandInvalidArgumentError(`${key} must be an array of strings`);
    }
    return patterns;
}
function patternHost(rule) {
    return rule.type === "wildcard" ? `*.${rule.hostname}` : rule.hostname;
}
function fetchPatternHosts(rule) {
    const host = patternHost(rule);
    return [host, `${host}.`];
}
function toBlocklistFetchPatterns(rules) {
    const patterns = [];
    for (const rule of rules) {
        for (const host of fetchPatternHosts(rule)) {
            for (const scheme of HTTP_SCHEMES) {
                patterns.push({
                    urlPattern: `${scheme}://${host}/*`,
                    requestStage: "Request",
                });
                patterns.push({
                    urlPattern: `${scheme}://${host}:*/*`,
                    requestStage: "Request",
                });
            }
        }
    }
    return patterns;
}
function toAllowlistFetchPatterns() {
    return HTTP_SCHEMES.map((scheme) => ({
        urlPattern: `${scheme}://*/*`,
        requestStage: "Request",
    }));
}
export function normalizeDomainPolicy(policy) {
    const allowedDomains = getDomainPatterns(policy, "allowedDomains");
    const blockedDomains = getDomainPatterns(policy, "blockedDomains");
    if (!allowedDomains.length && !blockedDomains.length)
        return null;
    const allowedDomainRules = normalizeDomainPatterns(allowedDomains, "allowedDomains");
    const blockedDomainRules = normalizeDomainPatterns(blockedDomains, "blockedDomains");
    return {
        allowedDomains: allowedDomainRules.map(patternHost),
        blockedDomains: blockedDomainRules.map(patternHost),
        allowedDomainRules,
        blockedDomainRules,
        fetchPatterns: allowedDomainRules.length
            ? toAllowlistFetchPatterns()
            : toBlocklistFetchPatterns(blockedDomainRules),
    };
}
function hostnameFromHttpUrl(url) {
    try {
        const parsed = new URL(url);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
            return null;
        }
        return canonicalizeHostname(parsed.hostname);
    }
    catch {
        return null;
    }
}
function matchesDomainRules(hostname, rules) {
    return rules.some((rule) => {
        if (rule.type === "exact") {
            return hostname === rule.hostname;
        }
        return hostname.endsWith(`.${rule.hostname}`);
    });
}
export function getDomainPolicyDecision(url, policy) {
    if (!policy)
        return { action: "continue" };
    const hostname = hostnameFromHttpUrl(url);
    if (!hostname)
        return { action: "continue" };
    if (matchesDomainRules(hostname, policy.blockedDomainRules)) {
        return { action: "block", reason: "blockedDomains" };
    }
    if (policy.allowedDomainRules.length &&
        !matchesDomainRules(hostname, policy.allowedDomainRules)) {
        return { action: "block", reason: "allowedDomains" };
    }
    return { action: "continue" };
}
