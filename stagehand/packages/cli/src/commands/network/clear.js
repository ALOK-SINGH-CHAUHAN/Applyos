import { BrowseCommand } from "../../base.js";
import { driverCommandFlags, runDriverCommandFromFlags, } from "../../lib/driver/command-cli.js";
export default class NetworkClear extends BrowseCommand {
    static description = "Clear captured network request directories for the active browser session.";
    static examples = [
        "browse network clear",
        "browse network clear --session research",
    ];
    static flags = {
        ...driverCommandFlags,
    };
    async run() {
        const { flags } = await this.parse(NetworkClear);
        await runDriverCommandFromFlags("network.clear", {}, flags);
    }
}
