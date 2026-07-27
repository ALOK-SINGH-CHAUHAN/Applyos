import { Args } from "@oclif/core";
import { createBrowserbaseClient, outputJson, withBrowserbaseApi, } from "../../../lib/cloud/api.js";
import { apiCommonFlags, toApiOptions } from "../../../lib/cloud/flags.js";
import { BrowseCommand } from "../../../base.js";
export default class ProjectsGet extends BrowseCommand {
    static description = "Get a project by ID.";
    static examples = ["browse cloud projects get <project-id>"];
    static args = {
        id: Args.string({ required: true, description: "Project ID." }),
    };
    static flags = { ...apiCommonFlags };
    async run() {
        const { args, flags } = await this.parse(ProjectsGet);
        await withBrowserbaseApi("projects", async () => {
            const client = createBrowserbaseClient(toApiOptions(flags));
            outputJson(await client.projects.retrieve(args.id));
        });
    }
}
