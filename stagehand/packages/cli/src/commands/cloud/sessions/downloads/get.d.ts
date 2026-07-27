import { BrowseCommand } from "../../../../base.js";
export default class SessionsDownloadsGet extends BrowseCommand {
    static description: string;
    static examples: string[];
    static args: {
        id: any;
    };
    static flags: {
        output: any;
        "api-key": any;
        "base-url": any;
    };
    run(): Promise<void>;
}
