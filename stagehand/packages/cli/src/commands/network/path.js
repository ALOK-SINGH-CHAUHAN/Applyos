import { BrowseCommand } from "../../base.js";
import { driverCommandFlags, runDriverCommandFromFlags, } from "../../lib/driver/command-cli.js";
export default class NetworkPath extends BrowseCommand {
    static description = "Print the network capture directory for the active browser session.";
    static examples = [
        "browse network path",
        "browse network path --session research",
    ];
    static flags = {
        ...driverCommandFlags,
    };
    async run() {
        const { flags } = await this.parse(NetworkPath);
        await runDriverCommandFromFlags("network.path", {}, flags);
    }
}
