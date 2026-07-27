import { BrowseCommand } from "../../../base.js";
export default class ContextsList extends BrowseCommand {
    static description: string;
    static examples: string[];
    static flags: {
        format: any;
        json: any;
        wide: any;
    };
    run(): Promise<void>;
}
