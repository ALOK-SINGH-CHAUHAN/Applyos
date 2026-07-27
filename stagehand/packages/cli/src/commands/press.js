import { Args } from "@oclif/core";
import { BrowseCommand } from "../base.js";
import { driverCommandFlags, runDriverCommandFromFlags, } from "../lib/driver/command-cli.js";
export default class Press extends BrowseCommand {
    static aliases = ["key"];
    static description = "Press a keyboard key in the active page.";
    static examples = [
        "browse press Enter",
        "browse press Escape",
        "browse key Meta+K",
    ];
    static args = {
        key: Args.string({
            description: "Key name or key chord, for example Enter, Escape, Meta+K.",
            required: true,
        }),
    };
    static flags = {
        ...driverCommandFlags,
    };
    async run() {
        const { args, flags } = await this.parse(Press);
        await runDriverCommandFromFlags("key", { key: args.key }, flags);
    }
}
