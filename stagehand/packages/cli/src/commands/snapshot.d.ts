import { BrowseCommand } from "../base.js";
export default class Snapshot extends BrowseCommand {
    static description: string;
    static examples: string[];
    static flags: {
        full: any;
        compact: any;
        filter: any;
        "max-depth": any;
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
