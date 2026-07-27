import { BrowseCommand } from "../../base.js";
export default class FunctionsInvoke extends BrowseCommand {
    static description: string;
    static examples: string[];
    static args: {
        functionId: any;
    };
    static flags: {
        "api-key": any;
        "base-url": any;
        "check-status": any;
        "no-wait": any;
        params: any;
    };
    run(): Promise<void>;
}
