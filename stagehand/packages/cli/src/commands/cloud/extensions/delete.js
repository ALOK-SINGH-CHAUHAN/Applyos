import { Args } from "@oclif/core";
import { outputJson, requestBrowserbase } from "../../../lib/cloud/api.js";
import { apiCommonFlags, toApiOptions } from "../../../lib/cloud/flags.js";
import { BrowseCommand } from "../../../base.js";
export default class ExtensionsDelete extends BrowseCommand {
    static description = "Delete a Chrome extension.";
    static examples = ["browse cloud extensions delete <extension-id>"];
    static args = {
        id: Args.string({ required: true, description: "Extension ID." }),
    };
    static flags = { ...apiCommonFlags };
    async run() {
        const { args, flags } = await this.parse(ExtensionsDelete);
        await requestBrowserbase(toApiOptions(flags), `/v1/extensions/${args.id}`, {
            method: "DELETE",
            headers: {
                Accept: "*/*",
            },
        });
        outputJson({ ok: true, id: args.id });
    }
}
