import { Args, Flags } from "@oclif/core";
import { BrowseCommand } from "../../base.js";
import { driverCommandFlags, parseNumber, runDriverCommandFromFlags, } from "../../lib/driver/command-cli.js";
export default class MouseScroll extends BrowseCommand {
    static description = "Scroll from raw viewport coordinates in the active page.";
    static examples = [
        "browse mouse scroll 400 500 0 600",
        "browse mouse scroll 400 500 0 -600",
        "browse mouse scroll 400 500 0 600 --return-xpath",
    ];
    static args = {
        x: Args.string({ description: "Viewport x coordinate.", required: true }),
        y: Args.string({ description: "Viewport y coordinate.", required: true }),
        deltaX: Args.string({
            description: "Horizontal scroll delta.",
            required: true,
        }),
        deltaY: Args.string({
            description: "Vertical scroll delta.",
            required: true,
        }),
    };
    static flags = {
        ...driverCommandFlags,
        "return-xpath": Flags.boolean({
            description: "Include the XPath under the coordinate when the driver can return it.",
        }),
    };
    async run() {
        const { args, flags } = await this.parse(MouseScroll);
        await runDriverCommandFromFlags("mouse.scroll", {
            deltaX: parseNumber(args.deltaX, "deltaX"),
            deltaY: parseNumber(args.deltaY, "deltaY"),
            returnXPath: flags["return-xpath"],
            x: parseNumber(args.x, "x"),
            y: parseNumber(args.y, "y"),
        }, flags);
    }
}
