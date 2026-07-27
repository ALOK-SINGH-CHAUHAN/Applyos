"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractSkills = void 0;
const deep_clone_1 = require("lib/deep-clone");
const get_section_lines_1 = require("lib/parse-resume-from-pdf/extract-resume-from-sections/lib/get-section-lines");
const resumeSlice_1 = require("lib/redux/resumeSlice");
const bullet_points_1 = require("lib/parse-resume-from-pdf/extract-resume-from-sections/lib/bullet-points");
const extractSkills = (sections) => {
    const lines = (0, get_section_lines_1.getSectionLinesByKeywords)(sections, ["skill"]);
    const descriptionsLineIdx = (0, bullet_points_1.getDescriptionsLineIdx)(lines) ?? 0;
    const descriptionsLines = lines.slice(descriptionsLineIdx);
    const descriptions = (0, bullet_points_1.getBulletPointsFromLines)(descriptionsLines);
    const featuredSkills = (0, deep_clone_1.deepClone)(resumeSlice_1.initialFeaturedSkills);
    if (descriptionsLineIdx !== 0) {
        const featuredSkillsLines = lines.slice(0, descriptionsLineIdx);
        const featuredSkillsTextItems = featuredSkillsLines
            .flat()
            .filter((item) => item.text.trim())
            .slice(0, 6);
        for (let i = 0; i < featuredSkillsTextItems.length; i++) {
            featuredSkills[i].skill = featuredSkillsTextItems[i].text;
        }
    }
    const skills = {
        featuredSkills,
        descriptions,
    };
    return { skills };
};
exports.extractSkills = extractSkills;
