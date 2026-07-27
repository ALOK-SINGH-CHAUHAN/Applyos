import { BrowseCommand } from "../../base.js";
import { installBundledCliSkill } from "../../lib/skills/install.js";
export default class SkillsInstall extends BrowseCommand {
    static description = "Install the bundled browse CLI skill.";
    static examples = ["browse skills install"];
    async run() {
        await installBundledCliSkill();
    }
}
