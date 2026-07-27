import { Args } from "@oclif/core";
import { BrowseCommand } from "../base.js";
import { driverCommandFlags, runDriverCommandFromFlags, } from "../lib/driver/command-cli.js";
export default class Click extends BrowseCommand {
    static description = "Click an element by snapshot ref, XPath, or selector. Use `browse mouse click` for raw coordinates.";
    static examples = [
        "browse click @0-12",
        "browse click 'button[type=submit]'",
        "browse click @0-12 --session research",
    ];
    static args = {
        selector: Args.string({
            description: "Snapshot ref such as @0-12, XPath, or selector.",
            required: true,
        }),
    };
    static flags = {
        ...driverCommandFlags,
    };
    async run() {
        const { args, flags } = await this.parse(Click);
        await runDriverCommandFromFlags("click", { selector: args.selector }, flags);
    }
}
