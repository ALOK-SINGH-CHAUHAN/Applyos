import { BrowseCommand } from "../../../base.js";
export default class SessionsList extends BrowseCommand {
    static description: string;
    static examples: string[];
    static flags: {
        all: any;
        limit: any;
        q: any;
        status: any;
        format: any;
        json: any;
        wide: any;
        "api-key": any;
        "base-url": any;
    };
    run(): Promise<void>;
}
