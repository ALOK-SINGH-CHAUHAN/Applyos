import { BrowseCommand } from "../../base.js";
export default class TemplatesFind extends BrowseCommand {
    static description: string;
    static examples: string[];
    static args: {
        query: any;
    };
    static flags: {
        format: any;
        json: any;
        wide: any;
    };
    run(): Promise<void>;
}
