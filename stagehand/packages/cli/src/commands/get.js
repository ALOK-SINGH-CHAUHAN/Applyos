import { Args } from "@oclif/core";
import { BrowseCommand } from "../base.js";
import { driverCommandFlags, runDriverCommandFromFlags, } from "../lib/driver/command-cli.js";
const GET_TYPES = [
    "url",
    "title",
    "text",
    "html",
    "value",
    "box",
    "visible",
    "checked",
    "markdown",
];
export default class Get extends BrowseCommand {
    static description = "Read page data or element state from the active browser page.";
    static examples = [
        "browse get url",
        "browse get title",
        "browse get text @0-12",
        "browse get markdown body",
        "browse get box 'button[type=submit]'",
    ];
    static args = {
        what: Args.string({
            description: `Value to read. One of: ${GET_TYPES.join(", ")}.`,
            options: GET_TYPES,
            required: true,
        }),
        selector: Args.string({
            description: "Snapshot ref, XPath, or selector. Required for element reads; markdown defaults to body.",
            required: false,
        }),
    };
    static flags = {
        ...driverCommandFlags,
    };
    async run() {
        const { args, flags } = await this.parse(Get);
        await runDriverCommandFromFlags("get", { selector: args.selector, what: args.what }, flags);
    }
}
