import { BrowseCommand } from "../../../base.js";
export default class SessionsUpdate extends BrowseCommand {
    static description: string;
    static examples: string[];
    static args: {
        id: any;
    };
    static flags: {
        status: any;
        body: any;
        stdin: any;
        "api-key": any;
        "base-url": any;
    };
    run(): Promise<void>;
}
