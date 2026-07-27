import { BrowseCommand } from "../../base.js";
export default class FunctionsInit extends BrowseCommand {
    static description: string;
    static examples: string[];
    static args: {
        projectName: any;
    };
    static flags: {
        "package-manager": any;
    };
    run(): Promise<void>;
}
