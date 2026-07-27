import { BrowseCommand } from "../../base.js";
export default class SkillsInstall extends BrowseCommand {
    static description: string;
    static examples: string[];
    run(): Promise<void>;
}
