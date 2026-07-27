import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { BrowseCommand } from "../../base.js";
import { fail } from "../../lib/errors.js";
import { bundledCliSkillPath } from "../../lib/skills/install.js";
export default class SkillsShow extends BrowseCommand {
    static description = "Print the bundled browse skill (usage patterns, workflows, gotchas) to stdout. Run before using browse in an agent.";
    static examples = ["browse skills show"];
    async run() {
        const skillMdPath = join(bundledCliSkillPath(), "SKILL.md");
        let contents;
        try {
            contents = await readFile(skillMdPath, "utf8");
        }
        catch (error) {
            fail(`Could not read the bundled browse skill (SKILL.md): ${error.message}`, 1, { resultCode: "skill_show_missing" });
        }
        this.log(contents);
    }
}
