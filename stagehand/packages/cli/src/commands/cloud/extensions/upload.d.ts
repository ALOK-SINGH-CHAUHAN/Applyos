import { BrowseCommand } from "../../../base.js";
export default class ExtensionsUpload extends BrowseCommand {
    static description: string;
    static examples: string[];
    static args: {
        file: any;
    };
    static flags: {
        "api-key": any;
        "base-url": any;
    };
    run(): Promise<void>;
}
