import { Args } from "@oclif/core";
import { createBrowserbaseClient, outputJson, withBrowserbaseApi, } from "../../../lib/cloud/api.js";
import { apiCommonFlags, toApiOptions } from "../../../lib/cloud/flags.js";
import { BrowseCommand } from "../../../base.js";
export default class SessionsLogs extends BrowseCommand {
    static description = "Get Browserbase session logs.";
    static examples = ["browse cloud sessions logs <session-id>"];
    static args = {
        id: Args.string({ required: true, description: "Session ID." }),
    };
    static flags = { ...apiCommonFlags };
    async run() {
        const { args, flags } = await this.parse(SessionsLogs);
        await withBrowserbaseApi("sessions", async () => {
            const client = createBrowserbaseClient(toApiOptions(flags));
            outputJson(await client.sessions.logs.list(args.id));
        });
    }
}
