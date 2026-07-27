import { BrowseCommand } from "../../base.js";
export default class FunctionsDev extends BrowseCommand {
    static description: string;
    static examples: string[];
    static args: {
        entrypoint: any;
    };
    static flags: {
        "api-key": any;
        "base-url": any;
        host: any;
        port: any;
        verbose: any;
    };
    run(): Promise<void>;
}
