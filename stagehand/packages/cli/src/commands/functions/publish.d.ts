import { BrowseCommand } from "../../base.js";
export default class FunctionsPublish extends BrowseCommand {
    static description: string;
    static examples: string[];
    static args: {
        entrypoint: any;
    };
    static flags: {
        "api-key": any;
        "base-url": any;
        "dry-run": any;
    };
    run(): Promise<void>;
}
