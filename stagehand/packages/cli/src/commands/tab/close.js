import { Args } from "@oclif/core";
import { BrowseCommand } from "../../base.js";
import { driverCommandFlags, runDriverCommandFromFlags, } from "../../lib/driver/command-cli.js";
export default class TabClose extends BrowseCommand {
    static description = "Close a tab by index or targetId. Without an argument, closes the active tab. Prefer targetId for stability.";
    static examples = [
        "browse tab close",
        "browse tab close 1",
        "browse tab close <target-id>",
        "browse tab close <target-id> --session research",
    ];
    static args = {
        tab: Args.string({
            description: "Optional tab index or targetId. Prefer targetId from `browse tab list` when indices may change.",
            required: false,
        }),
    };
    static flags = {
        ...driverCommandFlags,
    };
    async run() {
        const { args, flags } = await this.parse(TabClose);
        await runDriverCommandFromFlags("tab.close", { tab: args.tab }, flags);
    }
}
