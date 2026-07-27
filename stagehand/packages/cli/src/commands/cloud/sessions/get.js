import { Args } from "@oclif/core";
import { createBrowserbaseClient, outputJson, withBrowserbaseApi, } from "../../../lib/cloud/api.js";
import { apiCommonFlags, toApiOptions } from "../../../lib/cloud/flags.js";
import { BrowseCommand } from "../../../base.js";
export default class SessionsGet extends BrowseCommand {
    static description = "Get a Browserbase session by ID.";
    static examples = ["browse cloud sessions get <session-id>"];
    static args = {
        id: Args.string({ required: true, description: "Session ID." }),
    };
    static flags = { ...apiCommonFlags };
    async run() {
        const { args, flags } = await this.parse(SessionsGet);
        await withBrowserbaseApi("sessions", async () => {
            const client = createBrowserbaseClient(toApiOptions(flags));
            outputJson(await client.sessions.retrieve(args.id));
        });
    }
}
