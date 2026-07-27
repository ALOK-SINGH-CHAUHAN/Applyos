import { BrowseCommand } from "../../base.js";
export default class TemplatesList extends BrowseCommand {
    static description: string;
    static examples: string[];
    static flags: {
        category: any;
        source: any;
        tag: any;
        format: any;
        json: any;
        wide: any;
    };
    run(): Promise<void>;
}
