import { BrowseCommand } from "../../base.js";
export default class SkillsAdd extends BrowseCommand {
    static description: string;
    static examples: string[];
    static args: {
        skill: any;
    };
    run(): Promise<void>;
}
