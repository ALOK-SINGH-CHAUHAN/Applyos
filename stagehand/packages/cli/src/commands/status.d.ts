import { BrowseCommand } from "../base.js";
export default class Status extends BrowseCommand {
    static description: string;
    static examples: string[];
    static flags: {
        session: any;
    };
    run(): Promise<void>;
}
