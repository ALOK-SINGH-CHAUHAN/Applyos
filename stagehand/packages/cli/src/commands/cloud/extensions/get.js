import { Args } from "@oclif/core";
import { createBrowserbaseClient, outputJson, withBrowserbaseApi, } from "../../../lib/cloud/api.js";
import { apiCommonFlags, toApiOptions } from "../../../lib/cloud/flags.js";
import { BrowseCommand } from "../../../base.js";
export default class ExtensionsGet extends BrowseCommand {
    static description = "Get a Chrome extension by ID.";
    static examples = ["browse cloud extensions get <extension-id>"];
    static args = {
        id: Args.string({ required: true, description: "Extension ID." }),
    };
    static flags = { ...apiCommonFlags };
    async run() {
        const { args, flags } = await this.parse(ExtensionsGet);
        await withBrowserbaseApi("extensions", async () => {
            const client = createBrowserbaseClient(toApiOptions(flags));
            outputJson(await client.extensions.retrieve(args.id));
        });
    }
}
