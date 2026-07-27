import { BrowseCommand } from "../../base.js";
import { driverCommandFlags, runDriverCommandFromFlags, } from "../../lib/driver/command-cli.js";
export default class TabList extends BrowseCommand {
    static description = "List tabs in the active browser session, including stable targetIds.";
    static examples = [
        "browse tab list",
        "browse tab list --session research",
    ];
    static flags = {
        ...driverCommandFlags,
    };
    async run() {
        const { flags } = await this.parse(TabList);
        await runDriverCommandFromFlags("tab.list", {}, flags);
    }
}
