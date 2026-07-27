"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractEducation = void 0;
const get_section_lines_1 = require("lib/parse-resume-from-pdf/extract-resume-from-sections/lib/get-section-lines");
const subsections_1 = require("lib/parse-resume-from-pdf/extract-resume-from-sections/lib/subsections");
const common_features_1 = require("lib/parse-resume-from-pdf/extract-resume-from-sections/lib/common-features");
const feature_scoring_system_1 = require("lib/parse-resume-from-pdf/extract-resume-from-sections/lib/feature-scoring-system");
const bullet_points_1 = require("lib/parse-resume-from-pdf/extract-resume-from-sections/lib/bullet-points");
/**
 *              Unique Attribute
 * School       Has school
 * Degree       Has degree
 * GPA          Has number
 */
// prettier-ignore
const SCHOOLS = ['College', 'University', 'Institute', 'School', 'Academy', 'BASIS', 'Magnet'];
const hasSchool = (item) => SCHOOLS.some((school) => item.text.includes(school));
// prettier-ignore
const DEGREES = ["Associate", "Bachelor", "Master", "PhD", "Ph."];
const hasDegree = (item) => DEGREES.some((degree) => item.text.includes(degree)) ||
    /[ABM][A-Z\.]/.test(item.text); // Match AA, B.S., MBA, etc.
const matchGPA = (item) => item.text.match(/[0-4]\.\d{1,2}/);
const matchGrade = (item) => {
    const grade = parseFloat(item.text);
    if (Number.isFinite(grade) && grade <= 110) {
        return [String(grade)];
    }
    return null;
};
const SCHOOL_FEATURE_SETS = [
    [hasSchool, 4],
    [hasDegree, -4],
    [common_features_1.hasNumber, -4],
];
const DEGREE_FEATURE_SETS = [
    [hasDegree, 4],
    [hasSchool, -4],
    [common_features_1.hasNumber, -3],
];
const GPA_FEATURE_SETS = [
    [matchGPA, 4, true],
    [matchGrade, 3, true],
    [common_features_1.hasComma, -3],
    [common_features_1.hasLetter, -4],
];
const extractEducation = (sections) => {
    const educations = [];
    const educationsScores = [];
    const lines = (0, get_section_lines_1.getSectionLinesByKeywords)(sections, ["education"]);
    const subsections = (0, subsections_1.divideSectionIntoSubsections)(lines);
    for (const subsectionLines of subsections) {
        const textItems = subsectionLines.flat();
        const [school, schoolScores] = (0, feature_scoring_system_1.getTextWithHighestFeatureScore)(textItems, SCHOOL_FEATURE_SETS);
        const [degree, degreeScores] = (0, feature_scoring_system_1.getTextWithHighestFeatureScore)(textItems, DEGREE_FEATURE_SETS);
        const [gpa, gpaScores] = (0, feature_scoring_system_1.getTextWithHighestFeatureScore)(textItems, GPA_FEATURE_SETS);
        const [date, dateScores] = (0, feature_scoring_system_1.getTextWithHighestFeatureScore)(textItems, common_features_1.DATE_FEATURE_SETS);
        let descriptions = [];
        const descriptionsLineIdx = (0, bullet_points_1.getDescriptionsLineIdx)(subsectionLines);
        if (descriptionsLineIdx !== undefined) {
            const descriptionsLines = subsectionLines.slice(descriptionsLineIdx);
            descriptions = (0, bullet_points_1.getBulletPointsFromLines)(descriptionsLines);
        }
        educations.push({ school, degree, gpa, date, descriptions });
        educationsScores.push({
            schoolScores,
            degreeScores,
            gpaScores,
            dateScores,
        });
    }
    if (educations.length !== 0) {
        const coursesLines = (0, get_section_lines_1.getSectionLinesByKeywords)(sections, ["course"]);
        if (coursesLines.length !== 0) {
            educations[0].descriptions.push("Courses: " +
                coursesLines
                    .flat()
                    .map((item) => item.text)
                    .join(" "));
        }
    }
    return {
        educations,
        educationsScores,
    };
};
exports.extractEducation = extractEducation;
