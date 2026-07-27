import { BrowseCommand } from "../base.js";
import { driverCommandFlags, runDriverCommandFromFlags, } from "../lib/driver/command-cli.js";
export default class Cursor extends BrowseCommand {
    static description = "Enable a visible cursor overlay in the active browser page.";
    static examples = [
        "browse cursor",
        "browse cursor --session research",
    ];
    static flags = {
        ...driverCommandFlags,
    };
    async run() {
        const { flags } = await this.parse(Cursor);
        await runDriverCommandFromFlags("cursor", {}, flags);
    }
}
