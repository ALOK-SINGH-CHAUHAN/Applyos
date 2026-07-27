import { BrowseCommand } from "../base.js";
import { driverCommandFlags, runDriverCommandFromFlags, timeoutMsFlag, waitUntilFlag, } from "../lib/driver/command-cli.js";
export default class Reload extends BrowseCommand {
    static description = "Reload the active browser page.";
    static examples = [
        "browse reload",
        "browse reload --session research",
        "browse reload --wait networkidle --timeout 45000",
    ];
    static flags = {
        ...driverCommandFlags,
        timeout: timeoutMsFlag,
        wait: waitUntilFlag,
    };
    async run() {
        const { flags } = await this.parse(Reload);
        await runDriverCommandFromFlags("reload", { timeoutMs: flags.timeout, waitUntil: flags.wait }, flags);
    }
}
