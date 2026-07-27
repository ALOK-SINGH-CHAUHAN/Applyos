import os from "node:os";
import path from "node:path";
import { accessSync, realpathSync } from "node:fs";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { connectToMCPServer } from "@browserbasehq/stagehand";
function findBalancedJsonCandidate(text) {
    const starts = ["{", "["];
    for (const start of starts) {
        const index = text.indexOf(start);
        if (index === -1)
            continue;
        let depth = 0;
        let inString = false;
        let escaping = false;
        for (let i = index; i < text.length; i += 1) {
            const char = text[i];
            if (inString) {
                if (escaping) {
                    escaping = false;
                }
                else if (char === "\\") {
                    escaping = true;
                }
                else if (char === '"') {
                    inString = false;
                }
                continue;
            }
            if (char === '"') {
                inString = true;
                continue;
            }
            if (char === "{" || char === "[") {
                depth += 1;
            }
            else if (char === "}" || char === "]") {
                depth -= 1;
                if (depth === 0) {
                    return text.slice(index, i + 1);
                }
            }
        }
    }
    return null;
}
export function extractMcpText(result) {
    const parts = (result.content ?? []).flatMap((item) => {
        switch (item.type) {
            case "text":
                return [item.text];
            case "resource":
                return item.resource?.text ? [item.resource.text] : [];
            default:
                return [];
        }
    });
    return parts.join("\n").trim();
}
export function extractMcpImage(result) {
    for (const item of result.content ?? []) {
        if (item.type === "image") {
            return {
                data: item.data,
                mimeType: item.mimeType,
            };
        }
    }
    return null;
}
export function parseLooseJson(text) {
    const unwrap = (value) => {
        let current = value;
        while (typeof current === "string") {
            const trimmed = current.trim();
            if (!trimmed)
                break;
            if (!trimmed.startsWith("{") &&
                !trimmed.startsWith("[") &&
                !trimmed.startsWith('"')) {
                break;
            }
            try {
                current = JSON.parse(trimmed);
            }
            catch {
                break;
            }
        }
        return current;
    };
    const trimmed = text.trim();
    if (!trimmed) {
        throw new Error("Cannot parse empty MCP response as JSON");
    }
    const resultSection = trimmed.match(/### Result\s*([\s\S]*?)(?:\n###|$)/i);
    if (resultSection?.[1]) {
        return unwrap(JSON.parse(resultSection[1].trim()));
    }
    const returnedSection = trimmed.match(/returned:\s*([\s\S]*?)(?:\n###|$)/i);
    if (returnedSection?.[1]) {
        return parseLooseJson(returnedSection[1].trim());
    }
    const fencedMatch = trimmed.match(/```(?:json)?[ \t]*\n([\s\S]*?)```/i);
    if (fencedMatch?.[1]) {
        return unwrap(JSON.parse(fencedMatch[1].trim()));
    }
    try {
        return unwrap(JSON.parse(trimmed));
    }
    catch {
        const candidate = findBalancedJsonCandidate(trimmed);
        if (candidate) {
            return unwrap(JSON.parse(candidate));
        }
        throw new Error(`Failed to parse MCP JSON response: ${trimmed}`);
    }
}
export function parseChromeDevtoolsListedPages(text) {
    const pages = new Map();
    const lines = text.split(/\r?\n/);
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed)
            continue;
        const urlMatch = trimmed.match(/(https?:\/\/\S+|about:blank|data:[^\s|]+|chrome:\/\/[^\s|]+)/i);
        if (!urlMatch)
            continue;
        const url = urlMatch[1];
        const idPatterns = [
            /\bpageId\b\s*[:#]?\s*(\d+)/i,
            /\bid\b\s*[:#]?\s*(\d+)/i,
            /^\|\s*(\d+)\s*\|/,
            /^\s*(\d+)\s*[|:-]/,
            /#(\d+)/,
        ];
        let toolPageId = null;
        for (const pattern of idPatterns) {
            const match = trimmed.match(pattern);
            if (!match)
                continue;
            toolPageId = Number(match[1]);
            break;
        }
        if (toolPageId === null || Number.isNaN(toolPageId))
            continue;
        pages.set(toolPageId, { toolPageId, url });
    }
    return [...pages.values()].sort((left, right) => left.toolPageId - right.toolPageId);
}
function normalizeToolError(result, toolName) {
    if (!result.isError)
        return null;
    const text = extractMcpText(result);
    return new Error(text || `MCP tool "${toolName}" failed`);
}
export function createPnpmDlxEnv(env = {}) {
    return {
        ...Object.fromEntries(Object.entries(process.env).filter((entry) => {
            return typeof entry[1] === "string";
        })),
        ...Object.fromEntries(Object.entries(env).filter((entry) => {
            return typeof entry[1] === "string";
        })),
    };
}
export function resolvePnpmCommand() {
    const explicitCandidates = [
        process.env.PNPM_EXECUTABLE,
        process.env.npm_execpath,
        "/opt/homebrew/bin/pnpm",
        "/usr/local/bin/pnpm",
    ].filter((value) => Boolean(value));
    for (const candidate of explicitCandidates) {
        try {
            const resolved = realpathSync(candidate);
            if (resolved.toLowerCase().includes("corepack")) {
                continue;
            }
            accessSync(resolved);
            return resolved;
        }
        catch {
            continue;
        }
    }
    const pathValue = process.env.PATH ?? "";
    for (const directory of pathValue.split(path.delimiter)) {
        if (!directory)
            continue;
        const candidate = path.join(directory, "pnpm");
        try {
            const resolved = realpathSync(candidate);
            if (resolved.toLowerCase().includes("corepack")) {
                continue;
            }
            accessSync(resolved);
            return resolved;
        }
        catch {
            continue;
        }
    }
    return process.env.npm_execpath ?? "pnpm";
}
export class StdioMcpRuntime {
    client;
    artifactDir;
    constructor(client, artifactDir) {
        this.client = client;
        this.artifactDir = artifactDir;
    }
    static async connect(options) {
        const client = await connectToMCPServer({
            command: options.command,
            args: options.args,
            env: createPnpmDlxEnv(options.env),
        });
        const artifactBaseDir = options.artifactRootDir ?? os.tmpdir();
        const artifactDir = await mkdtemp(path.join(artifactBaseDir, "stagehand-evals-mcp-"));
        return new StdioMcpRuntime(client, artifactDir);
    }
    async callTool(toolName, args) {
        const result = (await this.client.callTool({
            name: toolName,
            arguments: args,
        }));
        const error = normalizeToolError(result, toolName);
        if (error)
            throw error;
        return result;
    }
    async callText(toolName, args) {
        const result = await this.callTool(toolName, args);
        return extractMcpText(result);
    }
    async callJson(toolName, args) {
        const text = await this.callText(toolName, args);
        return parseLooseJson(text);
    }
    artifactPath(filename) {
        return path.join(this.artifactDir, filename);
    }
    async readArtifact(filename) {
        return readFile(this.artifactPath(filename));
    }
    async readArtifactText(filename) {
        return readFile(this.artifactPath(filename), "utf8");
    }
    async close() {
        try {
            await this.client.close();
        }
        finally {
            await rm(this.artifactDir, { recursive: true, force: true }).catch(() => { });
        }
    }
}
