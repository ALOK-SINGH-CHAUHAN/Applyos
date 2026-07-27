import { Args } from "@oclif/core";
import { BrowseCommand } from "../../base.js";
import { driverCommandFlags, runDriverCommandFromFlags, } from "../../lib/driver/command-cli.js";
export default class TabSwitch extends BrowseCommand {
    static description = "Switch the active tab by index or targetId. Prefer targetId from `browse tab list` for stable agent workflows.";
    static examples = [
        "browse tab list",
        "browse tab switch 1",
        "browse tab switch <target-id>",
        "browse tab switch <target-id> --session research",
    ];
    static args = {
        tab: Args.string({
            description: "Tab index or targetId. Prefer targetId from `browse tab list` when indices may change.",
            required: true,
        }),
    };
    static flags = {
        ...driverCommandFlags,
    };
    async run() {
        const { args, flags } = await this.parse(TabSwitch);
        await runDriverCommandFromFlags("tab.switch", { tab: args.tab }, flags);
    }
}
