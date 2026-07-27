import { BrowseCommand } from "../../base.js";
export default class TemplatesClone extends BrowseCommand {
    static description: string;
    static examples: string[];
    static args: {
        slug: any;
        path: any;
    };
    static flags: {
        json: any;
        language: any;
    };
    run(): Promise<void>;
}
