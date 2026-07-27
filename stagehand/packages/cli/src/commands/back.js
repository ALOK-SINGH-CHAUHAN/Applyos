import { BrowseCommand } from "../base.js";
import { driverCommandFlags, runDriverCommandFromFlags, timeoutMsFlag, waitUntilFlag, } from "../lib/driver/command-cli.js";
export default class Back extends BrowseCommand {
    static description = "Navigate the active browser page backward.";
    static examples = [
        "browse back",
        "browse back --session research",
        "browse back --wait domcontentloaded",
    ];
    static flags = {
        ...driverCommandFlags,
        timeout: timeoutMsFlag,
        wait: waitUntilFlag,
    };
    async run() {
        const { flags } = await this.parse(Back);
        await runDriverCommandFromFlags("back", { timeoutMs: flags.timeout, waitUntil: flags.wait }, flags);
    }
}
