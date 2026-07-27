import { BrowseCommand } from "../../base.js";
export default class Fetch extends BrowseCommand {
    static description: string;
    static examples: string[];
    static args: {
        url: any;
    };
    static flags: {
        "allow-insecure-ssl": any;
        "allow-redirects": any;
        proxies: any;
        format: any;
        schema: any;
        output: any;
        "api-key": any;
        "base-url": any;
    };
    run(): Promise<void>;
}
