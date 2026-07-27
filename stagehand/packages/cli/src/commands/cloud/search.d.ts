import { BrowseCommand } from "../../base.js";
export default class Search extends BrowseCommand {
    static description: string;
    static examples: string[];
    static args: {
        query: any;
    };
    static flags: {
        "num-results": any;
        output: any;
        format: any;
        json: any;
        wide: any;
        "api-key": any;
        "base-url": any;
    };
    run(): Promise<void>;
}
