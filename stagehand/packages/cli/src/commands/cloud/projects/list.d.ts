import { BrowseCommand } from "../../../base.js";
export default class ProjectsList extends BrowseCommand {
    static description: string;
    static examples: string[];
    static flags: {
        format: any;
        json: any;
        wide: any;
        "api-key": any;
        "base-url": any;
    };
    run(): Promise<void>;
}
