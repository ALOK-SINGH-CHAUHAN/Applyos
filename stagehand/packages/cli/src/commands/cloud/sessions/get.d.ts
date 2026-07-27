import { BrowseCommand } from "../../../base.js";
export default class SessionsGet extends BrowseCommand {
    static description: string;
    static examples: string[];
    static args: {
        id: any;
    };
    static flags: {
        "api-key": any;
        "base-url": any;
    };
    run(): Promise<void>;
}
