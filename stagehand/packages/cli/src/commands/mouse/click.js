import { Args, Flags } from "@oclif/core";
import { BrowseCommand } from "../../base.js";
import { buttonFlag, driverCommandFlags, parseNumber, runDriverCommandFromFlags, } from "../../lib/driver/command-cli.js";
export default class MouseClick extends BrowseCommand {
    static description = "Click raw viewport coordinates in the active page.";
    static examples = [
        "browse mouse click 240 320",
        "browse mouse click 240 320 --button right",
        "browse mouse click 240 320 --click-count 2 --return-xpath",
    ];
    static args = {
        x: Args.string({ description: "Viewport x coordinate.", required: true }),
        y: Args.string({ description: "Viewport y coordinate.", required: true }),
    };
    static flags = {
        ...driverCommandFlags,
        button: buttonFlag,
        "click-count": Flags.integer({
            default: 1,
            description: "Number of clicks to send.",
            helpValue: "<count>",
        }),
        "return-xpath": Flags.boolean({
            description: "Include the XPath under the coordinate when the driver can return it.",
        }),
    };
    async run() {
        const { args, flags } = await this.parse(MouseClick);
        await runDriverCommandFromFlags("mouse.click", {
            button: flags.button,
            clickCount: flags["click-count"],
            returnXPath: flags["return-xpath"],
            x: parseNumber(args.x, "x"),
            y: parseNumber(args.y, "y"),
        }, flags);
    }
}
