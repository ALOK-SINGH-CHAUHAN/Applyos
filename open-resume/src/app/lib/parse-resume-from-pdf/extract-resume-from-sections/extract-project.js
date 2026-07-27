"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractProject = void 0;
const get_section_lines_1 = require("lib/parse-resume-from-pdf/extract-resume-from-sections/lib/get-section-lines");
const common_features_1 = require("lib/parse-resume-from-pdf/extract-resume-from-sections/lib/common-features");
const subsections_1 = require("lib/parse-resume-from-pdf/extract-resume-from-sections/lib/subsections");
const feature_scoring_system_1 = require("lib/parse-resume-from-pdf/extract-resume-from-sections/lib/feature-scoring-system");
const bullet_points_1 = require("lib/parse-resume-from-pdf/extract-resume-from-sections/lib/bullet-points");
const extractProject = (sections) => {
    const projects = [];
    const projectsScores = [];
    const lines = (0, get_section_lines_1.getSectionLinesByKeywords)(sections, ["project"]);
    const subsections = (0, subsections_1.divideSectionIntoSubsections)(lines);
    for (const subsectionLines of subsections) {
        const descriptionsLineIdx = (0, bullet_points_1.getDescriptionsLineIdx)(subsectionLines) ?? 1;
        const subsectionInfoTextItems = subsectionLines
            .slice(0, descriptionsLineIdx)
            .flat();
        const [date, dateScores] = (0, feature_scoring_system_1.getTextWithHighestFeatureScore)(subsectionInfoTextItems, common_features_1.DATE_FEATURE_SETS);
        const PROJECT_FEATURE_SET = [
            [common_features_1.isBold, 2],
            [(0, common_features_1.getHasText)(date), -4],
        ];
        const [project, projectScores] = (0, feature_scoring_system_1.getTextWithHighestFeatureScore)(subsectionInfoTextItems, PROJECT_FEATURE_SET, false);
        const descriptionsLines = subsectionLines.slice(descriptionsLineIdx);
        const descriptions = (0, bullet_points_1.getBulletPointsFromLines)(descriptionsLines);
        projects.push({ project, date, descriptions });
        projectsScores.push({
            projectScores,
            dateScores,
        });
    }
    return { projects, projectsScores };
};
exports.extractProject = extractProject;
