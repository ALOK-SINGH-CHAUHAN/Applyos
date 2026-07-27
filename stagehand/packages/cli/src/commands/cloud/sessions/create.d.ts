import { BrowseCommand } from "../../../base.js";
export default class SessionsCreate extends BrowseCommand {
    static description: string;
    static examples: string[];
    static flags: {
        body: any;
        stdin: any;
        proxies: any;
        "advanced-stealth": any;
        verified: any;
        "solve-captchas": any;
        "block-ads": any;
        region: any;
        "keep-alive": any;
        timeout: any;
        "context-id": any;
        persist: any;
        "record-session": any;
        "log-session": any;
        viewport: any;
        "extension-id": any;
        "api-key": any;
        "base-url": any;
    };
    run(): Promise<void>;
}
