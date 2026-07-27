import { Args, Flags } from "@oclif/core";
import { BrowseCommand } from "../../base.js";
import { initFunctionsProject } from "../../lib/functions/init.js";
const packageManagers = ["npm", "pnpm"];
export default class FunctionsInit extends BrowseCommand {
    static description = "Initialize a new Browserbase Functions project.";
    static examples = [
        "browse functions init my-function",
        "browse functions init my-function --package-manager npm",
    ];
    static args = {
        projectName: Args.string({
            description: "Directory name for the new Functions project.",
            required: false,
        }),
    };
    static flags = {
        "package-manager": Flags.string({
            default: "pnpm",
            description: "Package manager to use.",
            options: [...packageManagers],
        }),
    };
    async run() {
        const { args, flags } = await this.parse(FunctionsInit);
        await initFunctionsProject({
            packageManager: flags["package-manager"],
            projectName: args.projectName ?? "my-browserbase-function",
        });
    }
}
