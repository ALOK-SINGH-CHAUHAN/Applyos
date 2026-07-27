import { BrowseCommand } from "../../base.js";
export default class SkillsShow extends BrowseCommand {
    static description: string;
    static examples: string[];
    run(): Promise<void>;
}
