import { DriverError } from "../errors.js";
export function emptyRefMaps() {
    return { urlMap: {}, xpathMap: {} };
}
function parseRef(selector) {
    if (selector.startsWith("@")) {
        const rest = selector.slice(1);
        return rest.startsWith("[") && rest.endsWith("]")
            ? rest.slice(1, -1)
            : rest;
    }
    if (selector.startsWith("[") &&
        selector.endsWith("]") &&
        /^\[\d+-\d+]$/.test(selector)) {
        return selector.slice(1, -1);
    }
    if (selector.startsWith("ref=")) {
        return selector.slice(4);
    }
    return /^\d+-\d+$/.test(selector) ? selector : null;
}
export function resolveSelector(selector, refMaps) {
    const ref = parseRef(selector);
    if (!ref)
        return selector;
    const xpath = refMaps.xpathMap[ref];
    if (!xpath) {
        throw new DriverError(`Unknown ref "${ref}" - run browse snapshot first to populate refs (have ${Object.keys(refMaps.xpathMap).length} refs).`, { code: "stale_ref" });
    }
    return xpath;
}
