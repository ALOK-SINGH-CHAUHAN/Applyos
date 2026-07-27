import { BrowseCommand } from "../../base.js";
export default class SkillsFind extends BrowseCommand {
    static description: string;
    static examples: string[];
    static args: {
        query: any;
    };
    static flags: {
        all: any;
        limit: any;
        format: any;
        json: any;
        wide: any;
    };
    run(): Promise<void>;
}
