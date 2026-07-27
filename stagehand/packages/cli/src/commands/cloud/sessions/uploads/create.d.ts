import { BrowseCommand } from "../../../../base.js";
export default class SessionsUploadsCreate extends BrowseCommand {
    static description: string;
    static examples: string[];
    static args: {
        id: any;
        file: any;
    };
    static flags: {
        "api-key": any;
        "base-url": any;
    };
    run(): Promise<void>;
}
