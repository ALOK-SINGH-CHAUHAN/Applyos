import { BrowseCommand } from "../../base.js";
import { driverCommandFlags, runDriverCommandFromFlags, } from "../../lib/driver/command-cli.js";
export default class NetworkOn extends BrowseCommand {
    static description = "Enable network capture for the active browser session.";
    static examples = [
        "browse network on",
        "browse network on --session research",
    ];
    static flags = {
        ...driverCommandFlags,
    };
    async run() {
        const { flags } = await this.parse(NetworkOn);
        await runDriverCommandFromFlags("network.on", {}, flags);
    }
}
