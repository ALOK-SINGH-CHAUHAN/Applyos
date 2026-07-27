import { Args, Flags } from "@oclif/core";
import { BrowseCommand } from "../base.js";
import { driverCommandFlags, runDriverCommandFromFlags, } from "../lib/driver/command-cli.js";
export default class TypeText extends BrowseCommand {
    static description = "Type text into the active page at the current focus.";
    static examples = [
        "browse type 'hello world'",
        "browse type 'hello world' --delay 25",
        "browse type 'hello world' --mistakes",
    ];
    static args = {
        text: Args.string({
            description: "Text to type.",
            required: true,
        }),
    };
    static flags = {
        ...driverCommandFlags,
        delay: Flags.integer({
            description: "Delay between keystrokes in milliseconds.",
            helpValue: "<ms>",
        }),
        mistakes: Flags.boolean({
            description: "Allow human-like typing mistakes when supported by the browser driver.",
        }),
    };
    async run() {
        const { args, flags } = await this.parse(TypeText);
        await runDriverCommandFromFlags("type", { delay: flags.delay, mistakes: flags.mistakes, text: args.text }, flags);
    }
}
