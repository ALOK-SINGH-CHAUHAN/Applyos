import { BrowseCommand } from "../../../base.js";
export default class ContextsCreate extends BrowseCommand {
    static description: string;
    static examples: string[];
    static flags: {
        name: any;
        body: any;
        stdin: any;
        "api-key": any;
        "base-url": any;
    };
    run(): Promise<void>;
}
