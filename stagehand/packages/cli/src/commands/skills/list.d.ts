import { BrowseCommand } from "../../base.js";
export default class SkillsList extends BrowseCommand {
    static description: string;
    static examples: string[];
    static flags: {
        all: any;
        limit: any;
        format: any;
        json: any;
        wide: any;
    };
    run(): Promise<void>;
}
