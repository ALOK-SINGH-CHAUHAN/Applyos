import { Args, Flags } from "@oclif/core";
import { BrowseCommand } from "../base.js";
import { driverCommandFlags, parseInteger, parseNumber, runDriverCommandFromFlags, } from "../lib/driver/command-cli.js";
export default class Viewport extends BrowseCommand {
    static description = "Set the viewport size for the active browser page.";
    static examples = [
        "browse viewport 1280 720",
        "browse viewport 390 844 --scale 2",
        "browse viewport 1280 720 --scale 1.5",
        "browse viewport 1440 900 --session research",
    ];
    static args = {
        width: Args.string({
            description: "Viewport width in CSS pixels.",
            required: true,
        }),
        height: Args.string({
            description: "Viewport height in CSS pixels.",
            required: true,
        }),
    };
    static flags = {
        ...driverCommandFlags,
        scale: Flags.string({
            default: "1",
            description: "Device scale factor.",
            helpValue: "<scale>",
        }),
    };
    async run() {
        const { args, flags } = await this.parse(Viewport);
        await runDriverCommandFromFlags("viewport", {
            height: parseInteger(args.height, "height"),
            scale: parseNumber(flags.scale, "scale"),
            width: parseInteger(args.width, "width"),
        }, flags);
    }
}
