export function formatSnapshotTree(tree, options = {}) {
    let lines = tree.split("\n");
    if (options.maxDepth !== undefined) {
        lines = lines.filter((line) => lineDepth(line) <= options.maxDepth);
    }
    if (options.filter) {
        lines = filterLinesWithAncestors(lines, options.filter);
    }
    if (options.compact) {
        lines = compactLines(lines);
    }
    return lines.join("\n").trim();
}
function filterLinesWithAncestors(lines, pattern) {
    const matcher = createMatcher(pattern);
    return keepLinesWithAncestors(lines, matcher);
}
function keepLinesWithAncestors(lines, shouldKeep) {
    const keep = new Set();
    for (let index = 0; index < lines.length; index += 1) {
        if (!shouldKeep(lines[index] ?? ""))
            continue;
        keep.add(index);
        let depth = lineDepth(lines[index] ?? "");
        for (let ancestor = index - 1; ancestor >= 0; ancestor -= 1) {
            const ancestorDepth = lineDepth(lines[ancestor] ?? "");
            if (ancestorDepth < depth) {
                keep.add(ancestor);
                depth = ancestorDepth;
                if (ancestorDepth === 0)
                    break;
            }
        }
    }
    return lines.filter((_, index) => keep.has(index));
}
function createMatcher(pattern) {
    const regex = parseRegex(pattern);
    if (regex) {
        return (line) => regex.test(line);
    }
    const needle = pattern.toLowerCase();
    return (line) => line.toLowerCase().includes(needle);
}
function parseRegex(pattern) {
    const match = pattern.match(/^\/(.+)\/([a-z]*)$/i);
    if (!match)
        return null;
    try {
        return new RegExp(match[1] ?? "", match[2] ?? "");
    }
    catch {
        return null;
    }
}
function compactLines(lines) {
    const compacted = keepLinesWithAncestors(lines, isUsefulSnapshotLine);
    return compacted.length > 0 ? compacted : lines;
}
function isUsefulSnapshotLine(line) {
    return (/\[\d+-\d+]/.test(line) ||
        line.includes(": ") ||
        /\b(button|link|textbox|checkbox|radio|combobox)\b/i.test(line));
}
function lineDepth(line) {
    const match = line.match(/^\s*/);
    return Math.floor((match?.[0].length ?? 0) / 2);
}
