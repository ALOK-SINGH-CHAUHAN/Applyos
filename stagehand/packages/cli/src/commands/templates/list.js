import { Flags } from "@oclif/core";
import { BrowseCommand } from "../../base.js";
import { outputFormatFlags, outputJson, resolveOutputFormat, } from "../../lib/output.js";
import { listTemplates } from "../../lib/templates/api.js";
import { outputTemplateTable } from "../../lib/templates/output.js";
export default class TemplatesList extends BrowseCommand {
    static description = "List Browserbase templates.";
    static examples = [
        "browse templates list",
        'browse templates list --category "Web Automation"',
        "browse templates list --tag Python --source Browserbase",
        "browse templates list --wide",
        "browse templates list --json",
    ];
    static flags = {
        ...outputFormatFlags,
        category: Flags.string({
            description: "Filter templates by category.",
            helpValue: "<category>",
        }),
        source: Flags.string({
            description: "Filter templates by source.",
            helpValue: "<source>",
        }),
        tag: Flags.string({
            description: "Filter templates by tag.",
            helpValue: "<tag>",
        }),
    };
    async run() {
        const { flags } = await this.parse(TemplatesList);
        const templates = await listTemplates({
            category: flags.category,
            source: flags.source,
            tag: flags.tag,
        });
        if (resolveOutputFormat(flags) === "json") {
            outputJson({ templates });
            return;
        }
        outputTemplateTable(templates, { wide: flags.wide });
    }
}
