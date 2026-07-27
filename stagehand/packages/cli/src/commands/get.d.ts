import { BrowseCommand } from "../base.js";
export default class Get extends BrowseCommand {
    static description: string;
    static examples: string[];
    static args: {
        what: any;
        selector: any;
    };
    static flags: {
        "auto-connect": any;
        cdp: any;
        "chrome-arg": any;
        headed: any;
        headless: any;
        "ignore-default-chrome-arg": any;
        local: any;
        "no-default-chrome-args": any;
        proxies: any;
        remote: any;
        session: any;
        "target-id": any;
        verified: any;
    };
    run(): Promise<void>;
}
