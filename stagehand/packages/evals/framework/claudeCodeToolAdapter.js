import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod/v4";
import { EvalsError } from "../errors.js";
import { getRepoRootDir } from "../runtimePaths.js";
import { prepareCoreBrowserTarget } from "../core/targets/index.js";
import { CdpConnection } from "../core/tools/cdp_code.js";
const BROWSE_CLI_ENTRYPOINT = path.join(getRepoRootDir(), "packages", "cli", "bin", "run.js");
const BROWSE_CLI_BUILD_ARTIFACTS = [
    path.join(getRepoRootDir(), "packages", "cli", "oclif.manifest.json"),
    path.join(getRepoRootDir(), "packages", "cli", "dist", "commands", "open.js"),
];
const BROWSE_CLI_PACKAGE_JSON = path.join(getRepoRootDir(), "packages", "cli", "package.json");
const BROWSE_SKILL_SOURCE = path.join(getRepoRootDir(), "packages", "cli", "skills", "browse", "SKILL.md");
// The CLI skill below is written for interactive use and covers surface
// (install, Browse.sh discovery, Browserbase cloud/Functions/templates) that
// does not apply inside the eval harness. This addendum is inserted right
// after the CLI skill's frontmatter — before the model reads any of the
// conflicting examples in the body — at install time, so the harness ships
// one source of truth (the real, maintained browse skill) instead of a
// second copy that drifts.
const EVAL_HARNESS_ADDENDUM = `
## Eval Harness Addendum

This skill is installed by the Stagehand eval harness, which overrides some of
the guidance below:

- \`browse\` is already installed and pinned by the harness to this eval's
  session and environment. Never run \`npm install -g browse\` or otherwise
  install/upgrade it. Never pass \`--local\`, \`--remote\`, or \`--session\` —
  the harness's wrapper appends the correct environment and session flags to
  every command automatically.
- Run exactly one \`browse ...\` command per Bash tool call. Shell operators
  (\`|\`, \`&&\`, \`;\`, backticks, \`$()\`, and redirection) are rejected by the
  harness, so chained or piped commands will fail.
- Ignore the sections below about installing \`browse\`, Browse.sh skill
  discovery/installation (\`browse skills ...\`), Browserbase cloud/session/
  context/extension management (\`browse cloud ...\`), Functions
  (\`browse functions ...\`), and Templates (\`browse templates ...\`) — all out
  of scope during evals. Do not run those commands even though they are
  documented below.
- Do not edit repository files. Do not use network or web tools other than
  \`browse\`.
- When finished, report the result in the exact \`EVAL_RESULT\` format
  requested by the harness prompt.
`;
const ALLOW_UNSANDBOXED_LOCAL_ENV = "EVAL_CLAUDE_CODE_ALLOW_UNSANDBOXED_LOCAL";
const RUN_TOOL_SERVER = "stagehand_browser";
const RUN_TOOL_NAME = `mcp__${RUN_TOOL_SERVER}__run`;
export function getBrowseCliToolMetadata() {
    return {
        toolCommand: "browse",
        browseCliEntrypoint: BROWSE_CLI_ENTRYPOINT,
        ...readBrowseCliVersion(),
    };
}
export function allowUnsandboxedLocalClaudeCode() {
    return process.env[ALLOW_UNSANDBOXED_LOCAL_ENV] === "true";
}
export function getBrowseCliAllowedTools() {
    return allowUnsandboxedLocalClaudeCode() ? ["Skill", "Bash"] : ["Skill"];
}
export async function prepareClaudeCodeToolAdapter(input) {
    const toolSurface = resolveClaudeCodeToolSurface(input.toolSurface);
    const startupProfile = resolveClaudeCodeStartupProfile(toolSurface, input.environment, input.startupProfile);
    switch (toolSurface) {
        case "browse_cli":
            return prepareBrowseCliAdapter({
                ...input,
                toolSurface,
                startupProfile,
            });
        case "playwright_code":
            return preparePlaywrightCodeAdapter({
                ...input,
                toolSurface,
                startupProfile,
            });
        case "cdp_code":
            return prepareCdpCodeAdapter({
                ...input,
                toolSurface,
                startupProfile,
            });
        default:
            throw new EvalsError(`Claude Code harness supports --tool browse_cli, playwright_code, or cdp_code for execution right now; received "${toolSurface}".`);
    }
}
export function resolveClaudeCodeToolSurface(requested) {
    if (!requested)
        return "browse_cli";
    if (requested === "browse_cli" ||
        requested === "playwright_code" ||
        requested === "cdp_code") {
        return requested;
    }
    throw new EvalsError(`Claude Code harness supports --tool browse_cli, playwright_code, or cdp_code for execution right now; received "${requested}".`);
}
export function resolveClaudeCodeStartupProfile(toolSurface, environment, requested) {
    if (requested)
        return requested;
    if (toolSurface === "browse_cli") {
        return environment === "BROWSERBASE"
            ? "tool_create_browserbase"
            : "tool_launch_local";
    }
    if (toolSurface === "playwright_code" || toolSurface === "cdp_code") {
        return environment === "BROWSERBASE"
            ? "runner_provided_browserbase_cdp"
            : "runner_provided_local_cdp";
    }
    throw new EvalsError(`No Claude Code startup profile default for tool "${toolSurface}" in ${environment}.`);
}
async function prepareBrowseCliAdapter(input) {
    const adapter = await prepareBrowseCliHarnessAdapter({
        startupProfile: input.startupProfile,
        environment: input.environment,
        plan: input.plan,
        logger: input.logger,
        logCategory: "claude_code",
    });
    if (allowUnsandboxedLocalClaudeCode()) {
        input.logger.warn({
            category: "claude_code",
            message: `${ALLOW_UNSANDBOXED_LOCAL_ENV}=true: raw Bash auto-approval is enabled for Claude Code. Use only in an isolated checkout/container.`,
            level: 0,
        });
    }
    return {
        ...adapter,
        allowedTools: getBrowseCliAllowedTools(),
        settingSources: ["project"],
        canUseTool: async (toolName, commandInput) => {
            if (toolName === "Skill") {
                return { behavior: "allow", updatedInput: commandInput };
            }
            if (toolName !== "Bash") {
                return {
                    behavior: "deny",
                    message: "Only Skill and Bash are allowed.",
                };
            }
            const command = readCommand(commandInput);
            if (!isAllowedBrowseCommand(command)) {
                return {
                    behavior: "deny",
                    message: "Only browse commands are allowed for this eval harness.",
                };
            }
            return { behavior: "allow", updatedInput: commandInput };
        },
    };
}
export async function prepareBrowseCliHarnessAdapter(input) {
    const missingArtifact = BROWSE_CLI_BUILD_ARTIFACTS.find((artifact) => !fs.existsSync(artifact));
    if (missingArtifact) {
        throw new EvalsError(`browse_cli requires built CLI artifacts; missing ${missingArtifact}. Run pnpm --dir packages/cli build first.`);
    }
    if ((input.environment === "LOCAL" &&
        input.startupProfile !== "tool_launch_local") ||
        (input.environment === "BROWSERBASE" &&
            input.startupProfile !== "tool_create_browserbase")) {
        throw new EvalsError(`browse_cli startup profile "${input.startupProfile}" is not valid for environment "${input.environment}".`);
    }
    const session = createBrowseSessionName();
    const cwd = await fsp.mkdtemp(path.join(os.tmpdir(), "stagehand-evals-claude-browse-"));
    const wrapperPath = path.join(cwd, "browse");
    await installBrowseSkill(cwd);
    input.logger.log({
        category: input.logCategory,
        message: `Installed browse skill at ${path.join(cwd, ".claude", "skills", "browse", "SKILL.md")}`,
        level: 1,
    });
    const env = {
        ...process.env,
        BROWSE_SESSION: session,
        PATH: `${cwd}${path.delimiter}${process.env.PATH ?? ""}`,
    };
    const modeFlag = input.environment === "BROWSERBASE" ? "--remote" : "--local";
    await fsp.writeFile(wrapperPath, [
        "#!/usr/bin/env bash",
        "set -euo pipefail",
        // The mode flag (--local/--remote) selects the environment when the daemon
        // is first started and must be explicit so a set BROWSERBASE_API_KEY does
        // not silently auto-select remote. It is only accepted by the driver
        // commands, so skip it for the few subcommands that reject it (stop,
        // status). The session name is safe on every command.
        "cmd=${1:-}",
        "mode=()",
        'if [[ "$cmd" != "stop" && "$cmd" != "status" ]]; then',
        `  mode=(${JSON.stringify(modeFlag)})`,
        "fi",
        `exec ${JSON.stringify(process.execPath)} ${JSON.stringify(BROWSE_CLI_ENTRYPOINT)} "$@" "\${mode[@]+\${mode[@]}}" --session ${JSON.stringify(session)}`,
        "",
    ].join("\n"), { mode: 0o755 });
    return {
        toolSurface: "browse_cli",
        startupProfile: input.startupProfile,
        cwd,
        env,
        promptInstructions: buildBrowseCliPromptInstructions(input.plan),
        metadata: getBrowseCliToolMetadata(),
        cleanup: async () => {
            await runBrowseCommand(wrapperPath, ["stop", "--force"], input.logger, env, cwd).catch(() => undefined);
            await fsp.rm(cwd, { recursive: true, force: true });
        },
    };
}
async function preparePlaywrightCodeAdapter(input) {
    if (input.startupProfile !== "runner_provided_local_cdp" &&
        input.startupProfile !== "runner_provided_browserbase_cdp") {
        throw new EvalsError(`playwright_code startup profile "${input.startupProfile}" is not valid for Claude Code. Use runner_provided_local_cdp or runner_provided_browserbase_cdp.`);
    }
    const cwd = await fsp.mkdtemp(path.join(os.tmpdir(), "stagehand-evals-claude-playwright-"));
    const env = { ...process.env };
    let browser;
    let targetCleanup = async () => { };
    try {
        const target = await prepareCoreBrowserTarget({
            environment: input.environment,
            toolSurface: "playwright_code",
            startupProfile: input.startupProfile,
        });
        targetCleanup = target.cleanup;
        if (!target.providedEndpoint?.url) {
            throw new EvalsError(`playwright_code requires a runner-provided CDP endpoint for startup profile "${input.startupProfile}".`);
        }
        const { chromium } = await import("playwright");
        browser = await chromium.connectOverCDP(target.providedEndpoint.url, {
            headers: target.providedEndpoint.headers,
        });
        const context = browser.contexts()[0] ?? (await browser.newContext());
        const page = context.pages()[0] ?? (await context.newPage());
        const mcpServers = await buildPlaywrightRunMcpServers({
            browser,
            context,
            page,
            plan: input.plan,
            logger: input.logger,
        });
        input.logger.log({
            category: "claude_code",
            message: `Initialized playwright_code browser runtime for Claude Code run tool.`,
            level: 1,
            auxiliary: {
                startupProfile: {
                    value: input.startupProfile,
                    type: "string",
                },
                environment: {
                    value: input.environment,
                    type: "string",
                },
                ...(target.metadata && {
                    targetMetadata: {
                        value: JSON.stringify(target.metadata),
                        type: "object",
                    },
                }),
            },
        });
        return {
            toolSurface: "playwright_code",
            startupProfile: input.startupProfile,
            cwd,
            env,
            allowedTools: ["Bash", RUN_TOOL_NAME],
            settingSources: [],
            mcpServers,
            canUseTool: async (toolName, commandInput) => {
                if (toolName === RUN_TOOL_NAME || toolName === "Bash") {
                    return { behavior: "allow", updatedInput: commandInput };
                }
                return {
                    behavior: "deny",
                    message: `Use Bash for inspection and ${RUN_TOOL_NAME} for browser automation.`,
                };
            },
            promptInstructions: buildPlaywrightCodePromptInstructions(input.plan),
            cleanup: async () => {
                try {
                    await browser?.close();
                }
                catch {
                    // best-effort only
                }
                finally {
                    await targetCleanup();
                    await fsp.rm(cwd, { recursive: true, force: true });
                }
            },
        };
    }
    catch (error) {
        try {
            await browser?.close();
        }
        catch {
            // best-effort only
        }
        await targetCleanup();
        await fsp.rm(cwd, { recursive: true, force: true });
        throw error;
    }
}
async function prepareCdpCodeAdapter(input) {
    if (input.startupProfile !== "runner_provided_local_cdp" &&
        input.startupProfile !== "runner_provided_browserbase_cdp") {
        throw new EvalsError(`cdp_code startup profile "${input.startupProfile}" is not valid for Claude Code. Use runner_provided_local_cdp or runner_provided_browserbase_cdp.`);
    }
    const cwd = await fsp.mkdtemp(path.join(os.tmpdir(), "stagehand-evals-claude-cdp-"));
    const env = { ...process.env };
    let connection;
    let targetCleanup = async () => { };
    try {
        const target = await prepareCoreBrowserTarget({
            environment: input.environment,
            toolSurface: "cdp_code",
            startupProfile: input.startupProfile,
        });
        targetCleanup = target.cleanup;
        if (!target.providedEndpoint?.url) {
            throw new EvalsError(`cdp_code requires a runner-provided CDP endpoint for startup profile "${input.startupProfile}".`);
        }
        connection = await CdpConnection.connect(target.providedEndpoint);
        const activePage = await attachActiveCdpPage(connection);
        const mcpServers = await buildCdpRunMcpServers({
            connection,
            activePage,
            plan: input.plan,
            logger: input.logger,
        });
        input.logger.log({
            category: "claude_code",
            message: `Initialized cdp_code browser runtime for Claude Code run tool.`,
            level: 1,
            auxiliary: {
                startupProfile: {
                    value: input.startupProfile,
                    type: "string",
                },
                environment: {
                    value: input.environment,
                    type: "string",
                },
                targetId: {
                    value: activePage.targetId,
                    type: "string",
                },
                sessionId: {
                    value: activePage.sessionId,
                    type: "string",
                },
                ...(target.metadata && {
                    targetMetadata: {
                        value: JSON.stringify(target.metadata),
                        type: "object",
                    },
                }),
            },
        });
        return {
            toolSurface: "cdp_code",
            startupProfile: input.startupProfile,
            cwd,
            env,
            allowedTools: ["Bash", RUN_TOOL_NAME],
            settingSources: [],
            mcpServers,
            canUseTool: async (toolName, commandInput) => {
                if (toolName === RUN_TOOL_NAME || toolName === "Bash") {
                    return { behavior: "allow", updatedInput: commandInput };
                }
                return {
                    behavior: "deny",
                    message: `Use Bash for inspection and ${RUN_TOOL_NAME} for CDP browser automation.`,
                };
            },
            promptInstructions: buildCdpCodePromptInstructions(input.plan),
            cleanup: async () => {
                try {
                    await connection?.close();
                }
                catch {
                    // best-effort only
                }
                finally {
                    await targetCleanup();
                    await fsp.rm(cwd, { recursive: true, force: true });
                }
            },
        };
    }
    catch (error) {
        try {
            await connection?.close();
        }
        catch {
            // best-effort only
        }
        await targetCleanup();
        await fsp.rm(cwd, { recursive: true, force: true });
        throw error;
    }
}
async function buildPlaywrightRunMcpServers(input) {
    const sdk = (await import("@anthropic-ai/claude-agent-sdk"));
    const runTool = sdk.tool("run", [
        "Execute JavaScript against the initialized Playwright browser.",
        "The snippet runs inside an async function with page, context, browser, startUrl, task, and console in scope.",
        "Use await directly. Return a JSON-serializable value when useful.",
    ].join(" "), {
        code: z
            .string()
            .describe("JavaScript function body to execute. page/context/browser/startUrl/task are already in scope."),
    }, async ({ code }) => {
        return executePlaywrightRunTool({
            code,
            browser: input.browser,
            context: input.context,
            page: input.page,
            plan: input.plan,
            logger: input.logger,
        });
    }, { alwaysLoad: true });
    return {
        [RUN_TOOL_SERVER]: sdk.createSdkMcpServer({
            name: RUN_TOOL_SERVER,
            version: "1.0.0",
            tools: [runTool],
            alwaysLoad: true,
        }),
    };
}
async function executePlaywrightRunTool(input) {
    try {
        const result = await withTimeout(executePlaywrightSnippet(input), readPositiveIntEnv("EVAL_CLAUDE_CODE_RUN_TOOL_TIMEOUT_MS", 60_000));
        const text = stringifyToolResult(result);
        input.logger.log({
            category: "claude_code",
            message: `run tool completed: ${clip(text, 500)}`,
            level: 1,
        });
        return {
            content: [{ type: "text", text }],
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        input.logger.warn({
            category: "claude_code",
            message: `run tool failed: ${message}`,
            level: 1,
        });
        return {
            isError: true,
            content: [{ type: "text", text: message }],
        };
    }
}
async function executePlaywrightSnippet(input) {
    const AsyncFunction = Object.getPrototypeOf(async function () { })
        .constructor;
    const fn = new AsyncFunction("page", "context", "browser", "startUrl", "task", "console", input.code);
    return fn(input.page, input.context, input.browser, input.plan.startUrl, {
        dataset: input.plan.dataset,
        id: input.plan.taskId,
        startUrl: input.plan.startUrl,
        instruction: input.plan.instruction,
    }, buildRunToolConsole(input.logger));
}
async function buildCdpRunMcpServers(input) {
    const sdk = (await import("@anthropic-ai/claude-agent-sdk"));
    const runTool = sdk.tool("run", [
        "Execute JavaScript against the initialized Chrome DevTools Protocol browser.",
        "The snippet runs inside an async function with cdp, startUrl, task, and console in scope.",
        "Use await directly. Return a JSON-serializable value when useful.",
    ].join(" "), {
        code: z
            .string()
            .describe("JavaScript function body to execute. cdp/startUrl/task are already in scope."),
    }, async ({ code }) => {
        return executeCdpRunTool({
            code,
            connection: input.connection,
            activePage: input.activePage,
            plan: input.plan,
            logger: input.logger,
        });
    }, { alwaysLoad: true });
    return {
        [RUN_TOOL_SERVER]: sdk.createSdkMcpServer({
            name: RUN_TOOL_SERVER,
            version: "1.0.0",
            tools: [runTool],
            alwaysLoad: true,
        }),
    };
}
async function executeCdpRunTool(input) {
    try {
        const result = await withTimeout(executeCdpSnippet(input), readPositiveIntEnv("EVAL_CLAUDE_CODE_RUN_TOOL_TIMEOUT_MS", 60_000));
        const text = stringifyToolResult(result);
        input.logger.log({
            category: "claude_code",
            message: `run tool completed: ${clip(text, 500)}`,
            level: 1,
        });
        return {
            content: [{ type: "text", text }],
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        input.logger.warn({
            category: "claude_code",
            message: `run tool failed: ${message}`,
            level: 1,
        });
        return {
            isError: true,
            content: [{ type: "text", text: message }],
        };
    }
}
async function executeCdpSnippet(input) {
    const AsyncFunction = Object.getPrototypeOf(async function () { })
        .constructor;
    const fn = new AsyncFunction("cdp", "startUrl", "task", "console", input.code);
    return fn(buildCdpRuntime(input.connection, input.activePage, input.logger), input.plan.startUrl, {
        dataset: input.plan.dataset,
        id: input.plan.taskId,
        startUrl: input.plan.startUrl,
        instruction: input.plan.instruction,
    }, buildRunToolConsole(input.logger));
}
function buildCdpRuntime(connection, activePage, logger) {
    const listenerUnsubscribes = new Map();
    return {
        targetId: activePage.targetId,
        sessionId: activePage.sessionId,
        send: (method, params) => connection.send(method, params, activePage.sessionId),
        browser: (method, params) => connection.send(method, params),
        on: (method, listener) => {
            const unsubscribe = onCdpEvent(connection, activePage.sessionId, method, listener, logger);
            listenerUnsubscribes.set(listener, unsubscribe);
            return () => {
                listenerUnsubscribes.delete(listener);
                unsubscribe();
            };
        },
        off: (_method, listener) => {
            const unsubscribe = listenerUnsubscribes.get(listener);
            listenerUnsubscribes.delete(listener);
            unsubscribe?.();
        },
        once: (method, listenerOrTimeout, timeoutMs = 15_000) => {
            if (typeof listenerOrTimeout === "function") {
                const listener = listenerOrTimeout;
                const unsubscribe = onCdpEvent(connection, activePage.sessionId, method, (event) => {
                    unsubscribe?.();
                    listenerUnsubscribes.delete(listener);
                    return listener(event);
                }, logger);
                listenerUnsubscribes.set(listener, unsubscribe);
                return () => {
                    listenerUnsubscribes.delete(listener);
                    unsubscribe?.();
                };
            }
            return waitForCdpEvent(connection, activePage.sessionId, method, listenerOrTimeout ?? timeoutMs);
        },
        waitForEvent: (method, timeoutMs = 15_000) => waitForCdpEvent(connection, activePage.sessionId, method, timeoutMs),
        wait: sleep,
    };
}
function onCdpEvent(connection, sessionId, method, listener, logger) {
    return connection.onEvent((event) => {
        if (event.method !== method ||
            (event.sessionId && event.sessionId !== sessionId)) {
            return;
        }
        try {
            const result = listener(event);
            if (isPromiseLike(result)) {
                result.catch((error) => {
                    logger.warn({
                        category: "claude_code",
                        message: `cdp event listener failed: ${error instanceof Error ? error.message : String(error)}`,
                        level: 1,
                    });
                });
            }
        }
        catch (error) {
            logger.warn({
                category: "claude_code",
                message: `cdp event listener failed: ${error instanceof Error ? error.message : String(error)}`,
                level: 1,
            });
        }
    });
}
async function attachActiveCdpPage(connection) {
    const targets = await connection.send("Target.getTargets");
    const existingPage = targets.targetInfos.find((target) => target.type === "page" && !target.url?.startsWith("devtools://"));
    const targetId = existingPage?.targetId ??
        (await connection.send("Target.createTarget", {
            url: "about:blank",
        })).targetId;
    const attached = await connection.send("Target.attachToTarget", {
        targetId,
        flatten: true,
    });
    await connection.send("Page.enable", {}, attached.sessionId);
    await connection.send("Runtime.enable", {}, attached.sessionId);
    await connection.send("DOM.enable", {}, attached.sessionId);
    await connection.send("Page.setLifecycleEventsEnabled", { enabled: true }, attached.sessionId);
    return {
        targetId,
        sessionId: attached.sessionId,
        url: existingPage?.url ?? "about:blank",
    };
}
export function waitForCdpEvent(connection, sessionId, method, timeoutMs) {
    let timeout;
    let unsubscribe;
    const promise = new Promise((resolve, reject) => {
        const cleanup = () => {
            if (timeout)
                clearTimeout(timeout);
            unsubscribe?.();
        };
        unsubscribe = connection.onEvent((event) => {
            if (event.method !== method ||
                (event.sessionId && event.sessionId !== sessionId)) {
                return;
            }
            cleanup();
            resolve(event);
        });
        timeout = setTimeout(() => {
            cleanup();
            reject(new Error(`Timed out waiting for CDP event "${method}"`));
        }, timeoutMs);
    });
    // Claude-generated snippets often assign an event wait promise before a CDP
    // action and may abandon it after another branch finishes. Keep the promise
    // rejectable for awaited callers, but prevent abandoned waits from crashing
    // the eval process as unhandled rejections.
    promise.catch(() => undefined);
    return promise;
}
function buildRunToolConsole(logger) {
    const write = (level, values) => {
        logger.log({
            category: "claude_code",
            message: `run console.${level}: ${values.map(stringifyToolResult).join(" ")}`,
            level: 1,
        });
    };
    return {
        log: (...values) => write("log", values),
        warn: (...values) => write("warn", values),
        error: (...values) => write("error", values),
    };
}
function buildPlaywrightCodePromptInstructions(plan) {
    void plan;
    return [
        "Browser tool surface: playwright_code.",
        `Use the ${RUN_TOOL_NAME} tool for browser automation. It exposes an initialized Playwright page, context, browser, startUrl, and task object.`,
        "Use Bash for inspection and lightweight scripting. Do not create a separate browser process.",
        "The first browser action should usually be: await page.goto(startUrl, { waitUntil: 'domcontentloaded' }).",
        "Do not edit repository files.",
        "Return useful JSON-serializable values from run snippets so you can inspect progress.",
    ].join("\n");
}
function buildCdpCodePromptInstructions(plan) {
    void plan;
    return [
        "Browser tool surface: cdp_code.",
        `Use the ${RUN_TOOL_NAME} tool for browser automation. It exposes an initialized cdp object, startUrl, and task object.`,
        "Use cdp.send(method, params) for page-scoped CDP commands and cdp.browser(method, params) for browser-level commands.",
        "Helpers available: cdp.on(method, listener), cdp.once(method), cdp.waitForEvent(method, timeoutMs), cdp.wait(ms), cdp.targetId, cdp.sessionId.",
        'The first browser action should usually be: const loaded = cdp.waitForEvent("Page.loadEventFired"); await cdp.send("Page.navigate", { url: startUrl }); await loaded.',
        "Use Bash for inspection and lightweight scripting. Do not create a separate browser process.",
        "Do not edit repository files.",
        "Return useful JSON-serializable values from run snippets so you can inspect progress.",
    ].join("\n");
}
function buildBrowseCliPromptInstructions(plan) {
    void plan;
    return [
        "Browser tool surface: browse_cli.",
        "A project skill named browse is available. Use the Skill tool to load it before using browse.",
        "Use Bash only to run the browse command. It is already on PATH and pinned to this eval session.",
        "Do not use network/web tools outside browse. Do not edit repository files.",
        "The benchmark start URL is provided above.",
    ].join("\n");
}
export async function installBrowseSkill(cwd) {
    const targetDir = path.join(cwd, ".claude", "skills", "browse");
    await fsp.mkdir(targetDir, { recursive: true });
    const cliSkill = await fsp.readFile(BROWSE_SKILL_SOURCE, "utf8");
    await fsp.writeFile(path.join(targetDir, "SKILL.md"), insertAfterFrontmatter(cliSkill, EVAL_HARNESS_ADDENDUM));
}
// Inserts `addition` immediately after the skill's YAML frontmatter (so
// frontmatter parsing is unaffected) and before the rest of the body, so the
// eval-harness rules are the first thing the model reads rather than a
// caveat appended after conflicting examples.
//
// Frontmatter *boundary detection* is delegated to gray-matter rather than a
// hand-rolled regex: the regex here already needed a CRLF patch and still
// fails silently on BOM-prefixed files or a `---` line embedded inside a
// YAML multiline string, corrupting the installed skill by prepending the
// addendum before the frontmatter instead of after it.
//
// We deliberately do NOT use `matter.stringify()` to rebuild the file: it
// re-serializes the parsed data through js-yaml, which can reformat the
// frontmatter (e.g. collapsing/re-wrapping a folded `description: >` block)
// and would silently rewrite the shipped skill on every install. Instead we
// only use gray-matter to find the frontmatter/body boundary, then
// reassemble from the ORIGINAL raw string so the frontmatter block that
// ships is byte-identical to the frontmatter block in the source file.
export function insertAfterFrontmatter(markdown, addition) {
    let parsed;
    try {
        parsed = matter(markdown);
    }
    catch {
        // Unterminated/invalid YAML frontmatter -- fall back to the same
        // no-frontmatter behavior below instead of throwing during skill
        // install.
        return `${addition}\n${markdown}`;
    }
    // gray-matter never rebuilds the body string -- `parsed.content` is
    // always a raw suffix of `markdown` (it locates the frontmatter block and
    // slices it off). That makes `markdown.length - parsed.content.length`
    // the exact length, in the original source bytes, of everything before
    // the body: any leading BOM, the delimiters, and the source's own line
    // endings -- all preserved as-is. We don't rely on `parsed.matter` for
    // this, since it strips delimiters and can normalize newlines. When there
    // is no frontmatter, gray-matter returns `content` unchanged, so this
    // offset is 0.
    const frontmatterLength = markdown.length - parsed.content.length;
    if (frontmatterLength <= 0)
        return `${addition}\n${markdown}`;
    const frontmatter = markdown.slice(0, frontmatterLength);
    const body = parsed.content;
    return `${frontmatter}${addition}\n${body}`;
}
export function isAllowedBrowseCommand(command) {
    const trimmed = command.trim();
    if (/[\r\n]/.test(trimmed))
        return false;
    if (trimmed !== "browse" && !trimmed.startsWith("browse "))
        return false;
    return !/[;&|`$<>]/.test(trimmed);
}
function readCommand(input) {
    const command = input.command ?? input.cmd;
    return typeof command === "string" ? command : "";
}
function readPositiveIntEnv(key, fallback) {
    const raw = process.env[key];
    if (!raw)
        return fallback;
    const parsed = Number(raw);
    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
async function withTimeout(promise, timeoutMs) {
    let timeout;
    try {
        return await Promise.race([
            promise,
            new Promise((_, reject) => {
                timeout = setTimeout(() => reject(new Error(`run tool timed out after ${timeoutMs}ms`)), timeoutMs);
            }),
        ]);
    }
    finally {
        if (timeout)
            clearTimeout(timeout);
    }
}
function stringifyToolResult(value) {
    if (value === undefined)
        return "undefined";
    if (typeof value === "string")
        return value;
    try {
        return JSON.stringify(value);
    }
    catch {
        return String(value);
    }
}
function clip(value, maxLength) {
    return value.length <= maxLength
        ? value
        : `${value.slice(0, maxLength - 1)}…`;
}
function isPromiseLike(value) {
    return (value !== null &&
        typeof value === "object" &&
        "then" in value &&
        typeof value.then === "function" &&
        "catch" in value &&
        typeof value.catch === "function");
}
function createBrowseSessionName() {
    return `evals-claude-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
async function runBrowseCommand(wrapperPath, args, logger, env, cwd) {
    const { spawn } = await import("node:child_process");
    await new Promise((resolve, reject) => {
        const child = spawn(wrapperPath, args, {
            cwd,
            env,
            stdio: ["ignore", "pipe", "pipe"],
        });
        let stderr = "";
        child.stdout.setEncoding("utf8");
        child.stdout.on("data", (chunk) => {
            logger.log({ category: "browse_cli", message: chunk, level: 1 });
        });
        child.stderr.setEncoding("utf8");
        child.stderr.on("data", (chunk) => {
            stderr += chunk;
            logger.log({ category: "browse_cli", message: chunk, level: 1 });
        });
        child.on("error", reject);
        child.on("close", (code) => {
            if (code === 0) {
                resolve();
                return;
            }
            reject(new EvalsError(`browse_cli command failed (${args.join(" ")}): ${stderr.trim()}`));
        });
    });
}
function readBrowseCliVersion() {
    try {
        const parsed = JSON.parse(fs.readFileSync(BROWSE_CLI_PACKAGE_JSON, "utf8"));
        return typeof parsed.version === "string"
            ? { browseCliVersion: parsed.version }
            : {};
    }
    catch {
        return {};
    }
}
