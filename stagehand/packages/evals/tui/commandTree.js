/**
 * Command tree for the evals TUI.
 *
 * Models the user-visible command surface as a tree:
 *   root → run, list, new, config{path,set,reset,core{path,set,reset,setup}},
 *          experiments{list,show,open,compare}, verify, doctor
 *
 * Both the REPL (tui/repl.ts) and argv mode (cli.ts) build the same tree
 * via `buildCommandTree()` and dispatch user input through it. This is the
 * single source of truth for which commands exist and how they nest.
 *
 * Resolution rules (see resolveCommand):
 *   - Commands resolve relative to the current context (REPL contextPath).
 *   - The leading sigil `evals` strips itself and resolves the remainder
 *     from root — mirrors `evals X Y` from the shell.
 *   - Bare `evals` pops all context to root.
 *   - Meta commands (.., help, ?, exit/quit/q, clear, --help/-h) short-
 *     circuit before tree resolution and work at any depth.
 *
 * Existing handlers in tui/commands/* are wrapped, never rewritten.
 */
import process from "node:process";
import { tokenize } from "./tokenize.js";
import { bb, cyan, dim } from "./format.js";
const META_NAMES = {
    "..": "back",
    exit: "exit",
    quit: "exit",
    q: "exit",
    clear: "clear",
    help: "help",
    "?": "help-q",
    "--help": "help",
    "-h": "help",
};
// ---------------------------------------------------------------------------
// Tree walking + resolution
// ---------------------------------------------------------------------------
export function findChild(node, token) {
    if (!node.children)
        return undefined;
    const lower = token.toLowerCase();
    return node.children.find((c) => c.name.toLowerCase() === lower ||
        (c.aliases?.some((a) => a.toLowerCase() === lower) ?? false));
}
export function walkPath(root, path) {
    let node = root;
    for (const seg of path) {
        const child = findChild(node, seg);
        if (!child)
            return node;
        node = child;
    }
    return node;
}
/**
 * Greedy walk: consume each leading token that matches a child of the
 * current node. Stop at the first non-match — those tokens become args
 * for the deepest matched node's handler.
 */
function matchPath(start, tokens) {
    let node = start;
    const matched = [];
    let i = 0;
    while (i < tokens.length) {
        const child = findChild(node, tokens[i]);
        if (!child)
            break;
        node = child;
        matched.push(child.name);
        i++;
    }
    return { node, matchedNames: matched, remaining: tokens.slice(i) };
}
export function resolveCommand(root, contextPath, tokens) {
    if (tokens.length === 0)
        return { kind: "noop" };
    const first = tokens[0].toLowerCase();
    const meta = META_NAMES[first];
    if (meta) {
        return { kind: "meta", name: meta, args: tokens.slice(1) };
    }
    // Leading sigil: `evals` strips itself and resolves the remainder
    // from root, regardless of current context.
    if (first === "evals") {
        const rest = tokens.slice(1);
        if (rest.length === 0) {
            return { kind: "meta", name: "to-root", args: [] };
        }
        const m = matchPath(root, rest);
        if (m.matchedNames.length > 0) {
            return {
                kind: "run",
                node: m.node,
                args: m.remaining,
                absolutePath: m.matchedNames,
            };
        }
        return { kind: "unknown", token: rest[0], context: [] };
    }
    // Relative — match against the current context, no root fallback.
    const current = walkPath(root, contextPath);
    const m = matchPath(current, tokens);
    if (m.matchedNames.length > 0) {
        return {
            kind: "run",
            node: m.node,
            args: m.remaining,
            absolutePath: [...contextPath, ...m.matchedNames],
        };
    }
    return { kind: "unknown", token: tokens[0], context: contextPath };
}
// ---------------------------------------------------------------------------
// Prompt rendering
// ---------------------------------------------------------------------------
export function renderPrompt(contextPath) {
    const segs = contextPath.map((p) => `${cyan(p)} ${dim(">")} `).join("");
    return `${bb("evals")} ${dim(">")} ${segs}`;
}
/**
 * Resolve `tokens` against the tree and execute the result. Caller owns
 * error handling and prompt reprinting.
 *
 * Returns an outcome the caller can inspect — cli.ts uses it to decide
 * whether the invocation counts as a "first use" for the welcome marker.
 */
export async function dispatch(root, tokens, ctx) {
    const result = resolveCommand(root, ctx.contextPath ?? [], tokens);
    switch (result.kind) {
        case "noop":
            return { kind: "noop" };
        case "meta":
            await runMeta(result.name, result.args, root, ctx);
            return { kind: "meta" };
        case "run": {
            // Help is only triggered when `help` / `--help` / `-h` sits IMMEDIATELY
            // after the matched path. Later positions are arguments or flag values
            // and must reach the handler unchanged (e.g. `config set trials --help`
            // must surface a parse error, not silently print help).
            const first = result.args[0];
            const wantsHelp = first === "help" || first === "--help" || first === "-h";
            if (wantsHelp && result.node.printHelp) {
                await result.node.printHelp(result.absolutePath);
                return { kind: "help" };
            }
            if (result.node.handler) {
                await result.node.handler(result.args, ctx);
            }
            else if (result.args.length > 0) {
                throw new Error(`Unknown subcommand "${result.args[0]}" in ${pretty(result.absolutePath)}`);
            }
            else if (result.node.printHelp) {
                await result.node.printHelp(result.absolutePath);
                return { kind: "help" };
            }
            // Descend on bare (REPL only). `config` and `config core` already
            // printed via their handler; `experiments` printed via printHelp.
            if (ctx.contextPath !== null &&
                result.node.children &&
                result.args.length === 0) {
                const target = result.absolutePath;
                const same = target.length === ctx.contextPath.length &&
                    target.every((s, i) => s === ctx.contextPath[i]);
                if (!same) {
                    ctx.setContextPath?.(target);
                }
            }
            return { kind: "ran", absolutePath: result.absolutePath };
        }
        case "unknown": {
            // Unknown-token shorthand at root: hand off to the run leaf so
            // `evals act` keeps working. Only at root — at depth this errors.
            if (result.context.length === 0) {
                const runNode = findChild(root, "run");
                if (runNode?.handler) {
                    // Strip a leading "evals" sigil so parseRunArgs doesn't
                    // misinterpret it as a target or flag.
                    const forwarded = tokens[0]?.toLowerCase() === "evals" ? tokens.slice(1) : tokens;
                    await runNode.handler(forwarded, ctx);
                    return { kind: "ran", absolutePath: ["run"] };
                }
            }
            throw new Error(unknownMessage(result.token, result.context));
        }
    }
}
async function runMeta(name, args, root, ctx) {
    switch (name) {
        case "back": {
            if (ctx.contextPath === null) {
                throw new Error('".." is not available outside the REPL');
            }
            if (ctx.contextPath.length === 0) {
                console.log(dim("  Already at root."));
                return;
            }
            ctx.popContext?.();
            return;
        }
        case "to-root": {
            // Bare `evals` mid-line. In REPL, pop all context. In argv, no-op.
            if (ctx.contextPath === null)
                return;
            ctx.setContextPath?.([]);
            return;
        }
        case "clear": {
            if (ctx.contextPath === null) {
                throw new Error("`clear` is not available outside the REPL");
            }
            console.clear();
            return;
        }
        case "exit": {
            if (ctx.contextPath === null) {
                throw new Error("`exit` is not available outside the REPL");
            }
            console.log(dim("\n  Goodbye.\n"));
            process.exit(0);
            return;
        }
        case "help":
        case "help-q": {
            const path = ctx.contextPath ?? [];
            const current = walkPath(root, path);
            if (args.length > 0) {
                // `help <child>` — resolve relative to current context.
                const m = matchPath(current, args);
                if (m.matchedNames.length > 0 && m.node.printHelp) {
                    await m.node.printHelp([...path, ...m.matchedNames]);
                    return;
                }
            }
            if (current.printHelp) {
                await current.printHelp(path);
                return;
            }
            if (root.printHelp) {
                await root.printHelp([]);
            }
            return;
        }
    }
}
function pretty(path) {
    return path.length === 0 ? "evals >" : `evals > ${path.join(" > ")}`;
}
function unknownMessage(token, context) {
    if (context.length === 0) {
        return `Unknown command "${token}". Type "help" for the command list.`;
    }
    return `Unknown command "${token}" in ${pretty(context)}. Type "evals ${token} …" to run from root, "help" to see subcommands here, or ".." to leave the context.`;
}
// ---------------------------------------------------------------------------
// Tree factory — wraps existing handlers as leaf nodes.
// ---------------------------------------------------------------------------
/**
 * Build the canonical command tree. The factory is parameter-less because
 * leaves close over the `CommandContext` they receive at dispatch time —
 * the same tree instance can serve REPL (with abortRef + contextPath) and
 * argv (both null) contexts.
 */
export function buildCommandTree() {
    // Help printers are imported lazily to avoid pulling braintrust into
    // quiet commands like `config path`.
    const help = async () => import("./commands/help.js");
    const runNode = {
        name: "run",
        summary: "Run evals",
        printHelp: async () => (await help()).printRunHelp(),
        handler: async (args, ctx) => {
            const { parseRunArgs, resolveRunOptions } = await import("./commands/parse.js");
            const { readConfig } = await import("./commands/config.js");
            const { runCommand } = await import("./commands/run.js");
            const flags = parseRunArgs(args);
            const configFile = readConfig(ctx.entryDir);
            const resolved = resolveRunOptions(flags, configFile.defaults, process.env, configFile.core);
            // Argv mode (no abortRef): handle --legacy here, mirroring cli.ts.
            if (ctx.abortRef === null) {
                if (flags.legacy) {
                    const { runLegacy } = await import("./commands/legacy.js");
                    const { discoverTasks } = await import("../framework/discovery.js");
                    const { getRuntimeTasksRoot } = await import("../runtimePaths.js");
                    const registry = await discoverTasks(getRuntimeTasksRoot(), false);
                    await runLegacy(resolved, flags, registry);
                    return;
                }
                await runCommand(resolved);
                return;
            }
            // REPL mode: pass abort signal so Esc can cancel.
            const registry = await ctx.getRegistry();
            ctx.abortRef.current = new AbortController();
            try {
                await runCommand(resolved, registry, ctx.abortRef.current.signal);
            }
            finally {
                ctx.abortRef.current = null;
            }
        },
    };
    const listNode = {
        name: "list",
        summary: "List tasks and categories",
        printHelp: async () => (await help()).printListHelp(),
        handler: async (args, ctx) => {
            const { printList } = await import("./commands/list.js");
            const detailed = args.includes("--detailed") || args.includes("-d");
            const tierFilter = args.find((a) => !a.startsWith("-"));
            const registry = await ctx.getRegistry();
            printList(registry, tierFilter, detailed);
        },
    };
    const newNode = {
        name: "new",
        summary: "Scaffold a new task",
        printHelp: async () => (await help()).printNewHelp(),
        handler: async (args, ctx) => {
            const { scaffoldTask } = await import("./commands/new.js");
            const task = scaffoldTask(args);
            // REPL: re-discover so the new task is immediately resolvable.
            if (task && ctx.abortRef !== null) {
                const { discoverTasks } = await import("../framework/discovery.js");
                const { getRuntimeTasksRoot } = await import("../runtimePaths.js");
                const registry = await discoverTasks(getRuntimeTasksRoot(), false);
                ctx.setRegistry(registry);
            }
        },
    };
    // ---- config (leaf + children) ----
    // All `config core` leaves share the same help page (printConfigCoreHelp);
    // all `config` leaves share printConfigHelp. Setting printHelp on each leaf
    // makes `evals config core <leaf> help` resolve here in dispatch — leaves
    // never hand a stray "help" token to their wrapped handler.
    const printConfigCoreHelpThunk = async () => (await help()).printConfigCoreHelp();
    const printConfigHelpThunk = async () => (await help()).printConfigHelp();
    const configCorePath = {
        name: "path",
        summary: "Print the config file path",
        printHelp: printConfigCoreHelpThunk,
        handler: async (_args, ctx) => {
            const { handleCore } = await import("./commands/core.js");
            await handleCore(["path"], ctx.entryDir);
        },
    };
    const configCoreSet = {
        name: "set",
        summary: "Set core tool/startup",
        printHelp: printConfigCoreHelpThunk,
        handler: async (args, ctx) => {
            const { handleCore } = await import("./commands/core.js");
            await handleCore(["set", ...args], ctx.entryDir);
        },
    };
    const configCoreReset = {
        name: "reset",
        summary: "Reset core configuration",
        printHelp: printConfigCoreHelpThunk,
        handler: async (args, ctx) => {
            const { handleCore } = await import("./commands/core.js");
            await handleCore(["reset", ...args], ctx.entryDir);
        },
    };
    const configCoreSetup = {
        name: "setup",
        summary: "Interactive wizard (coming soon)",
        printHelp: printConfigCoreHelpThunk,
        handler: async (_args, ctx) => {
            const { handleCore } = await import("./commands/core.js");
            await handleCore(["setup"], ctx.entryDir);
        },
    };
    const configCore = {
        name: "core",
        summary: "Configure core tier defaults",
        printHelp: async () => (await help()).printConfigCoreHelp(),
        handler: async (args, ctx) => {
            const { handleCore } = await import("./commands/core.js");
            await handleCore(args, ctx.entryDir);
        },
        children: [configCorePath, configCoreSet, configCoreReset, configCoreSetup],
    };
    const configPath = {
        name: "path",
        summary: "Print the evals.config.json file path",
        printHelp: printConfigHelpThunk,
        handler: async (_args, ctx) => {
            const { handleConfig } = await import("./commands/config.js");
            await handleConfig(["path"], ctx.entryDir);
        },
    };
    const configSet = {
        name: "set",
        summary: "Set a default value",
        printHelp: printConfigHelpThunk,
        handler: async (args, ctx) => {
            const { handleConfig } = await import("./commands/config.js");
            await handleConfig(["set", ...args], ctx.entryDir);
        },
    };
    const configReset = {
        name: "reset",
        summary: "Reset one key or all defaults",
        printHelp: printConfigHelpThunk,
        handler: async (args, ctx) => {
            const { handleConfig } = await import("./commands/config.js");
            await handleConfig(["reset", ...args], ctx.entryDir);
        },
    };
    const configNode = {
        name: "config",
        summary: "Get/set default run configuration",
        printHelp: async () => (await help()).printConfigHelp(),
        handler: async (args, ctx) => {
            // matchPath strips known children (path/set/reset/core) before
            // we get here, so any args remaining are unknown subcommands —
            // delegate to handleConfig which prints the right error.
            const { handleConfig, printConfig } = await import("./commands/config.js");
            if (args.length === 0) {
                printConfig(ctx.entryDir);
                return;
            }
            await handleConfig(args, ctx.entryDir);
        },
        children: [configPath, configSet, configReset, configCore],
    };
    // ---- experiments (pure namespace) ----
    const experimentsList = {
        name: "list",
        summary: "Show recent runs",
        printHelp: async () => (await help()).printExperimentsHelp("list"),
        handler: async (args) => {
            const { handleExperiments } = await import("./commands/experiments.js");
            await handleExperiments(["list", ...args]);
        },
    };
    const experimentsShow = {
        name: "show",
        summary: "Show one experiment",
        printHelp: async () => (await help()).printExperimentsHelp("show"),
        handler: async (args) => {
            const { handleExperiments } = await import("./commands/experiments.js");
            await handleExperiments(["show", ...args]);
        },
    };
    const experimentsOpen = {
        name: "open",
        summary: "Open one experiment in the browser",
        printHelp: async () => (await help()).printExperimentsHelp("open"),
        handler: async (args) => {
            const { handleExperiments } = await import("./commands/experiments.js");
            await handleExperiments(["open", ...args]);
        },
    };
    const experimentsCompare = {
        name: "compare",
        summary: "Generate an HTML comparison report",
        printHelp: async () => (await help()).printExperimentsHelp("compare"),
        handler: async (args) => {
            const { handleExperiments } = await import("./commands/experiments.js");
            await handleExperiments(["compare", ...args]);
        },
    };
    const experimentsNode = {
        name: "experiments",
        summary: "Inspect Braintrust experiment runs",
        printHelp: async () => (await help()).printExperimentsHelp(),
        handler: async (args) => {
            // Bare invocation prints help (preserves today's `evals experiments`
            // behavior). With an unknown trailing token, error out.
            if (args.length > 0) {
                throw new Error(`Unknown experiments subcommand "${args[0]}"`);
            }
            const { printExperimentsHelp } = await import("./commands/help.js");
            printExperimentsHelp();
        },
        children: [
            experimentsList,
            experimentsShow,
            experimentsOpen,
            experimentsCompare,
        ],
    };
    const doctorNode = {
        name: "doctor",
        aliases: ["health"],
        summary: "Health report (env keys, config, discovery)",
        printHelp: async () => (await import("./commands/doctor.js")).printDoctorHelp(),
        handler: async (args, ctx) => {
            const { handleDoctor } = await import("./commands/doctor.js");
            const exitCode = await handleDoctor(args, ctx.entryDir);
            if (exitCode !== 0)
                process.exitCode = exitCode;
        },
    };
    const verifyNode = {
        name: "verify",
        summary: "Re-score a saved trajectory",
        printHelp: async () => (await import("./commands/verify.js")).printVerifyHelp(),
        handler: async (args) => {
            const { handleVerify } = await import("./commands/verify.js");
            await handleVerify(args);
        },
    };
    const root = {
        name: "evals",
        summary: "Stagehand evals CLI",
        printHelp: async () => (await help()).printHelp(),
        children: [
            runNode,
            listNode,
            configNode,
            experimentsNode,
            newNode,
            verifyNode,
            doctorNode,
        ],
    };
    return root;
}
// ---------------------------------------------------------------------------
// Argv tokenization: re-split args that contain `>` (e.g. from `\>` in shell).
// ---------------------------------------------------------------------------
/**
 * Re-tokenize a shell-split argv array on `>` boundaries.
 *
 * The shell consumes unescaped `>` as a redirect, so users who want
 * `evals experiments > list` from a terminal must escape (`\>`) or quote
 * the chunk. Either way the `>` survives in argv and we split on it here.
 *
 * Caveat: a quoted arg containing `>` (e.g. `"foo > bar"`) will also be
 * split. That's fine for known subcommand surfaces — none of our targets
 * or option values legitimately contain `>` characters.
 */
export function tokenizeArgv(args) {
    const out = [];
    for (const arg of args) {
        if (arg === ">")
            continue;
        if (!arg.includes(">")) {
            out.push(arg);
            continue;
        }
        for (const piece of arg.split(">")) {
            if (piece)
                out.push(piece);
        }
    }
    return out;
}
// Re-export tokenize so callers only import from one place.
export { tokenize };
