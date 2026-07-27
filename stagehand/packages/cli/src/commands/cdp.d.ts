import { BrowseCommand } from "../base.js";
export default class Cdp extends BrowseCommand {
    static description: string;
    static examples: string[];
    static args: {
        target: any;
    };
    static flags: {
        domain: any;
        pretty: any;
    };
    run(): Promise<void>;
}
