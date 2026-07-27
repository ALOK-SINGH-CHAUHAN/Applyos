import { BrowseCommand } from "../base.js";
import { driverCommandFlags, runDriverCommandFromFlags, timeoutMsFlag, waitUntilFlag, } from "../lib/driver/command-cli.js";
export default class Forward extends BrowseCommand {
    static description = "Navigate the active browser page forward.";
    static examples = [
        "browse forward",
        "browse forward --session research",
        "browse forward --wait domcontentloaded",
    ];
    static flags = {
        ...driverCommandFlags,
        timeout: timeoutMsFlag,
        wait: waitUntilFlag,
    };
    async run() {
        const { flags } = await this.parse(Forward);
        await runDriverCommandFromFlags("forward", { timeoutMs: flags.timeout, waitUntil: flags.wait }, flags);
    }
}
