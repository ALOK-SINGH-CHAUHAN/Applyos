import { BrowseCommand } from "../../../base.js";
export default class ContextsAdd extends BrowseCommand {
    static description: string;
    static examples: string[];
    static args: {
        name: any;
        id: any;
    };
    static flags: {
        force: any;
    };
    run(): Promise<void>;
}
