import { BrowseCommand } from "../../base.js";
export default class MouseDrag extends BrowseCommand {
    static description: string;
    static examples: string[];
    static args: {
        fromX: any;
        fromY: any;
        toX: any;
        toY: any;
    };
    static flags: {
        button: any;
        delay: any;
        "return-xpath": any;
        steps: any;
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
