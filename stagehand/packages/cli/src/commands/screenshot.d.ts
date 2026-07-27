import { BrowseCommand } from "../base.js";
export default class Screenshot extends BrowseCommand {
    static description: string;
    static examples: string[];
    static flags: {
        animations: any;
        base64: any;
        caret: any;
        clip: any;
        "full-page": any;
        path: any;
        quality: any;
        type: any;
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
