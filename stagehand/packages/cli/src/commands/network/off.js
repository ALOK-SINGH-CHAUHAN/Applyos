import { BrowseCommand } from "../../base.js";
import { driverCommandFlags, runDriverCommandFromFlags, } from "../../lib/driver/command-cli.js";
export default class NetworkOff extends BrowseCommand {
    static description = "Disable network capture for the active browser session.";
    static examples = [
        "browse network off",
        "browse network off --session research",
    ];
    static flags = {
        ...driverCommandFlags,
    };
    async run() {
        const { flags } = await this.parse(NetworkOff);
        await runDriverCommandFromFlags("network.off", {}, flags);
    }
}
