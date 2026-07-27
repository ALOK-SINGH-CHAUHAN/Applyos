import { EvalsError } from "../errors.js";
import { prepareBrowseCliHarnessAdapter, } from "./claudeCodeToolAdapter.js";
export async function prepareCodexToolAdapter(input) {
    const toolSurface = resolveCodexToolSurface(input.toolSurface);
    const startupProfile = resolveCodexStartupProfile(toolSurface, input.environment, input.startupProfile);
    return prepareBrowseCliHarnessAdapter({
        startupProfile,
        environment: input.environment,
        plan: input.plan,
        logger: input.logger,
        logCategory: "codex",
    });
}
export function resolveCodexToolSurface(requested) {
    if (!requested)
        return "browse_cli";
    if (requested === "browse_cli")
        return requested;
    throw new EvalsError(`Codex harness supports --tool browse_cli for execution right now; received "${requested}".`);
}
export function resolveCodexStartupProfile(toolSurface, environment, requested) {
    if (requested)
        return requested;
    if (toolSurface === "browse_cli") {
        return environment === "BROWSERBASE"
            ? "tool_create_browserbase"
            : "tool_launch_local";
    }
    throw new EvalsError(`No Codex startup profile default for tool "${toolSurface}" in ${environment}.`);
}
