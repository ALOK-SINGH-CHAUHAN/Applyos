import { BrowseCommand } from "../base.js";
export default class Stop extends BrowseCommand {
    static description: string;
    static examples: string[];
    static flags: {
        force: any;
        session: any;
    };
    run(): Promise<void>;
}
