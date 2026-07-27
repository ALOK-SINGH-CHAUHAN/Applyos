/**
 * Normalize V8 coverage ranges using sourcemaps to avoid offset/1x floor issues.
 *
 * Prereqs: V8 coverage JSON files plus JS files with inline or external sourcemaps.
 * Args: --coverage-dir <dir> (or NODE_V8_COVERAGE).
 * Env: NODE_V8_COVERAGE, V8_COVERAGE_SCAN_LIMIT.
 * Example: tsx packages/core/scripts/normalize-v8-coverage.ts --coverage-dir coverage/e2e-local
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SourceMapConsumer, } from "source-map";
import { getRepoRootDir, isMainModule } from "../lib/v3/runtimePaths.js";
const toFilePath = (urlOrPath) => {
    if (!urlOrPath)
        return null;
    if (urlOrPath.startsWith("node:"))
        return null;
    if (urlOrPath.startsWith("file:")) {
        try {
            return fileURLToPath(urlOrPath);
        }
        catch {
            return null;
        }
    }
    return path.isAbsolute(urlOrPath) ? urlOrPath : null;
};
const readSourceMap = (jsPath) => {
    if (!fs.existsSync(jsPath))
        return null;
    const source = fs.readFileSync(jsPath, "utf8");
    const inlineMatch = source.match(/sourceMappingURL=data:application\/json;base64,([A-Za-z0-9+/=]+)/);
    if (inlineMatch) {
        return JSON.parse(Buffer.from(inlineMatch[1], "base64").toString("utf8"));
    }
    const mapMatch = source.match(/sourceMappingURL=([^\s]+)/);
    if (!mapMatch)
        return null;
    const mapFile = mapMatch[1].trim();
    if (mapFile.startsWith("data:"))
        return null;
    const mapPath = path.resolve(path.dirname(jsPath), mapFile);
    if (!fs.existsSync(mapPath))
        return null;
    return JSON.parse(fs.readFileSync(mapPath, "utf8"));
};
const buildLineStarts = (source) => {
    const lineStarts = [0];
    for (let i = 0; i < source.length; i++) {
        if (source[i] === "\n")
            lineStarts.push(i + 1);
    }
    return lineStarts;
};
const offsetToLineCol = (lineStarts, offset) => {
    let low = 0;
    let high = lineStarts.length - 1;
    while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const start = lineStarts[mid];
        const next = mid + 1 < lineStarts.length ? lineStarts[mid + 1] : Infinity;
        if (start <= offset && offset < next) {
            return { line: mid + 1, column: offset - start };
        }
        if (start > offset) {
            high = mid - 1;
        }
        else {
            low = mid + 1;
        }
    }
    return { line: 1, column: 0 };
};
const lineColToOffset = (lineStarts, line, column, sourceLength) => {
    const lineIndex = Math.max(0, line - 1);
    const lineStart = lineStarts[lineIndex] ?? 0;
    const lineEnd = lineIndex + 1 < lineStarts.length
        ? lineStarts[lineIndex + 1] - 1
        : sourceLength;
    const clampedColumn = Math.max(0, Math.min(column, lineEnd - lineStart));
    return lineStart + clampedColumn;
};
const mapOriginalPosition = (consumer, line, column, bias) => consumer.originalPositionFor({
    line,
    column,
    bias,
});
const findMappedStart = (ctx, startOffset, endOffset, options) => {
    const maxScan = Math.min(options.maxScan, Math.max(0, endOffset - startOffset));
    const startPos = offsetToLineCol(ctx.lineStarts, startOffset);
    let mapped = mapOriginalPosition(ctx.consumer, startPos.line, startPos.column, SourceMapConsumer.LEAST_UPPER_BOUND);
    if (!mapped.source) {
        mapped = mapOriginalPosition(ctx.consumer, startPos.line, startPos.column, SourceMapConsumer.GREATEST_LOWER_BOUND);
    }
    if (mapped.source) {
        return {
            mapped: {
                source: mapped.source,
                line: mapped.line ?? 1,
                column: mapped.column ?? 0,
            },
            offset: startOffset,
        };
    }
    const limit = Math.min(endOffset, startOffset + maxScan);
    for (let off = startOffset + 1; off <= limit; off++) {
        const pos = offsetToLineCol(ctx.lineStarts, off);
        mapped = mapOriginalPosition(ctx.consumer, pos.line, pos.column, SourceMapConsumer.LEAST_UPPER_BOUND);
        if (!mapped.source) {
            mapped = mapOriginalPosition(ctx.consumer, pos.line, pos.column, SourceMapConsumer.GREATEST_LOWER_BOUND);
        }
        if (mapped.source) {
            return {
                mapped: {
                    source: mapped.source,
                    line: mapped.line ?? 1,
                    column: mapped.column ?? 0,
                },
                offset: off,
            };
        }
    }
    return null;
};
const findMappedEnd = (ctx, startOffset, endOffset, options, targetSource) => {
    const maxScan = Math.min(options.maxScan, Math.max(0, endOffset - startOffset));
    const endPos = offsetToLineCol(ctx.lineStarts, endOffset);
    let mapped = mapOriginalPosition(ctx.consumer, endPos.line, endPos.column, SourceMapConsumer.GREATEST_LOWER_BOUND);
    if (!mapped.source || (targetSource && mapped.source !== targetSource)) {
        mapped = mapOriginalPosition(ctx.consumer, endPos.line, endPos.column, SourceMapConsumer.LEAST_UPPER_BOUND);
    }
    if (mapped.source && (!targetSource || mapped.source === targetSource)) {
        return {
            mapped: {
                source: mapped.source,
                line: mapped.line ?? 1,
                column: mapped.column ?? 0,
            },
            offset: endOffset,
        };
    }
    const limit = Math.max(startOffset, endOffset - maxScan);
    for (let off = endOffset - 1; off >= limit; off--) {
        const pos = offsetToLineCol(ctx.lineStarts, off);
        mapped = mapOriginalPosition(ctx.consumer, pos.line, pos.column, SourceMapConsumer.GREATEST_LOWER_BOUND);
        if (!mapped.source || (targetSource && mapped.source !== targetSource)) {
            mapped = mapOriginalPosition(ctx.consumer, pos.line, pos.column, SourceMapConsumer.LEAST_UPPER_BOUND);
        }
        if (mapped.source && (!targetSource || mapped.source === targetSource)) {
            return {
                mapped: {
                    source: mapped.source,
                    line: mapped.line ?? 1,
                    column: mapped.column ?? 0,
                },
                offset: off,
            };
        }
    }
    return null;
};
const normalizeRange = (range, ctx, options) => {
    if (range.endOffset <= range.startOffset)
        return false;
    const startMapping = findMappedStart(ctx, range.startOffset, range.endOffset, options);
    if (!startMapping)
        return false;
    const endMapping = findMappedEnd(ctx, range.startOffset, range.endOffset, options, startMapping.mapped.source);
    if (!endMapping)
        return false;
    let startOffset = startMapping.offset;
    let endOffset = endMapping.offset;
    if (range.count === 0) {
        const genStart = ctx.consumer.generatedPositionFor({
            source: startMapping.mapped.source,
            line: startMapping.mapped.line,
            column: 0,
            bias: SourceMapConsumer.LEAST_UPPER_BOUND,
        });
        const genEnd = ctx.consumer.generatedPositionFor({
            source: startMapping.mapped.source,
            line: endMapping.mapped.line ?? startMapping.mapped.line,
            column: Number.MAX_SAFE_INTEGER,
            bias: SourceMapConsumer.GREATEST_LOWER_BOUND,
        });
        if (genStart.line && genEnd.line) {
            const expandedStart = lineColToOffset(ctx.lineStarts, genStart.line, genStart.column ?? 0, ctx.sourceLength);
            const expandedEnd = lineColToOffset(ctx.lineStarts, genEnd.line, genEnd.column ?? 0, ctx.sourceLength);
            startOffset = Math.min(startOffset, expandedStart);
            endOffset = Math.max(endOffset, expandedEnd);
        }
    }
    if (endOffset <= startOffset)
        return false;
    if (startOffset !== range.startOffset || endOffset !== range.endOffset) {
        range.startOffset = startOffset;
        range.endOffset = endOffset;
        return true;
    }
    return false;
};
const normalizeCoverageDir = async (options) => {
    if (!fs.existsSync(options.coverageDir))
        return;
    const jsonFiles = [];
    const walk = (dir) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = `${dir}/${entry.name}`;
            if (entry.isDirectory()) {
                if (entry.name === ".v8-tmp" || entry.name === "merged") {
                    continue;
                }
                walk(full);
            }
            else if (entry.isFile() && entry.name.endsWith(".json")) {
                jsonFiles.push(full);
            }
        }
    };
    walk(options.coverageDir);
    if (jsonFiles.length === 0)
        return;
    const sourceCache = new Map();
    try {
        for (const file of jsonFiles) {
            const data = JSON.parse(fs.readFileSync(file, "utf8"));
            if (!Array.isArray(data.result))
                continue;
            let updated = false;
            for (const entry of data.result) {
                const jsPath = entry.url ? toFilePath(entry.url) : null;
                if (!jsPath)
                    continue;
                let ctx = sourceCache.get(jsPath);
                if (ctx === undefined) {
                    const map = readSourceMap(jsPath);
                    if (!map) {
                        sourceCache.set(jsPath, null);
                        continue;
                    }
                    const source = fs.readFileSync(jsPath, "utf8");
                    ctx = {
                        lineStarts: buildLineStarts(source),
                        sourceLength: source.length,
                        consumer: await new SourceMapConsumer(map),
                    };
                    sourceCache.set(jsPath, ctx);
                }
                if (!ctx)
                    continue;
                if (!entry?.functions)
                    continue;
                for (const block of entry.functions) {
                    if (!block?.ranges)
                        continue;
                    for (const range of block.ranges) {
                        if (normalizeRange(range, ctx, options)) {
                            updated = true;
                        }
                    }
                }
            }
            if (updated) {
                fs.writeFileSync(file, JSON.stringify(data));
            }
        }
    }
    finally {
        for (const ctx of sourceCache.values()) {
            ctx?.consumer.destroy();
        }
    }
};
export const normalizeV8Coverage = async (coverageDir) => {
    const repoRoot = getRepoRootDir();
    const resolvedDir = path.isAbsolute(coverageDir)
        ? coverageDir
        : path.resolve(repoRoot, coverageDir);
    const maxScan = Number(process.env.V8_COVERAGE_SCAN_LIMIT ?? 20000);
    await normalizeCoverageDir({ coverageDir: resolvedDir, maxScan });
};
export default normalizeV8Coverage;
const main = async () => {
    const args = process.argv.slice(2);
    const idx = args.indexOf("--coverage-dir");
    const coverageDir = (idx >= 0 ? args[idx + 1] : undefined) ?? process.env.NODE_V8_COVERAGE;
    if (!coverageDir) {
        console.error("Missing coverage dir (use --coverage-dir or NODE_V8_COVERAGE).");
        process.exit(1);
    }
    await normalizeV8Coverage(coverageDir);
};
if (isMainModule()) {
    main().catch((error) => {
        console.error(error);
        process.exit(1);
    });
}
