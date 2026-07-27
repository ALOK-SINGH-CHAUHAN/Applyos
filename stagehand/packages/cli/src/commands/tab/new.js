import { Args } from "@oclif/core";
import { BrowseCommand } from "../../base.js";
import { driverCommandFlags, runDriverCommandFromFlags, } from "../../lib/driver/command-cli.js";
export default class TabNew extends BrowseCommand {
    static description = "Open a new tab and make it active.";
    static examples = [
        "browse tab new",
        "browse tab new https://example.com",
        "browse tab new https://example.com --session research",
    ];
    static args = {
        url: Args.string({
            description: "Optional URL to open in the new tab.",
            required: false,
        }),
    };
    static flags = {
        ...driverCommandFlags,
    };
    async run() {
        const { args, flags } = await this.parse(TabNew);
        await runDriverCommandFromFlags("tab.new", { url: args.url }, flags);
    }
}
