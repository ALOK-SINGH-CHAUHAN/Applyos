"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractWorkExperience = void 0;
const get_section_lines_1 = require("lib/parse-resume-from-pdf/extract-resume-from-sections/lib/get-section-lines");
const common_features_1 = require("lib/parse-resume-from-pdf/extract-resume-from-sections/lib/common-features");
const subsections_1 = require("lib/parse-resume-from-pdf/extract-resume-from-sections/lib/subsections");
const feature_scoring_system_1 = require("lib/parse-resume-from-pdf/extract-resume-from-sections/lib/feature-scoring-system");
const bullet_points_1 = require("lib/parse-resume-from-pdf/extract-resume-from-sections/lib/bullet-points");
// prettier-ignore
const WORK_EXPERIENCE_KEYWORDS_LOWERCASE = ['work', 'experience', 'employment', 'history', 'job'];
// prettier-ignore
const JOB_TITLES = ['Accountant', 'Administrator', 'Advisor', 'Agent', 'Analyst', 'Apprentice', 'Architect', 'Assistant', 'Associate', 'Auditor', 'Bartender', 'Biologist', 'Bookkeeper', 'Buyer', 'Carpenter', 'Cashier', 'CEO', 'Clerk', 'Co-op', 'Co-Founder', 'Consultant', 'Coordinator', 'CTO', 'Developer', 'Designer', 'Director', 'Driver', 'Editor', 'Electrician', 'Engineer', 'Extern', 'Founder', 'Freelancer', 'Head', 'Intern', 'Janitor', 'Journalist', 'Laborer', 'Lawyer', 'Lead', 'Manager', 'Mechanic', 'Member', 'Nurse', 'Officer', 'Operator', 'Operation', 'Photographer', 'President', 'Producer', 'Recruiter', 'Representative', 'Researcher', 'Sales', 'Server', 'Scientist', 'Specialist', 'Supervisor', 'Teacher', 'Technician', 'Trader', 'Trainee', 'Treasurer', 'Tutor', 'Vice', 'VP', 'Volunteer', 'Webmaster', 'Worker'];
const hasJobTitle = (item) => JOB_TITLES.some((jobTitle) => item.text.split(/\s/).some((word) => word === jobTitle));
const hasMoreThan5Words = (item) => item.text.split(/\s/).length > 5;
const JOB_TITLE_FEATURE_SET = [
    [hasJobTitle, 4],
    [common_features_1.hasNumber, -4],
    [hasMoreThan5Words, -2],
];
const extractWorkExperience = (sections) => {
    const workExperiences = [];
    const workExperiencesScores = [];
    const lines = (0, get_section_lines_1.getSectionLinesByKeywords)(sections, WORK_EXPERIENCE_KEYWORDS_LOWERCASE);
    const subsections = (0, subsections_1.divideSectionIntoSubsections)(lines);
    for (const subsectionLines of subsections) {
        const descriptionsLineIdx = (0, bullet_points_1.getDescriptionsLineIdx)(subsectionLines) ?? 2;
        const subsectionInfoTextItems = subsectionLines
            .slice(0, descriptionsLineIdx)
            .flat();
        const [date, dateScores] = (0, feature_scoring_system_1.getTextWithHighestFeatureScore)(subsectionInfoTextItems, common_features_1.DATE_FEATURE_SETS);
        const [jobTitle, jobTitleScores] = (0, feature_scoring_system_1.getTextWithHighestFeatureScore)(subsectionInfoTextItems, JOB_TITLE_FEATURE_SET);
        const COMPANY_FEATURE_SET = [
            [common_features_1.isBold, 2],
            [(0, common_features_1.getHasText)(date), -4],
            [(0, common_features_1.getHasText)(jobTitle), -4],
        ];
        const [company, companyScores] = (0, feature_scoring_system_1.getTextWithHighestFeatureScore)(subsectionInfoTextItems, COMPANY_FEATURE_SET, false);
        const subsectionDescriptionsLines = subsectionLines.slice(descriptionsLineIdx);
        const descriptions = (0, bullet_points_1.getBulletPointsFromLines)(subsectionDescriptionsLines);
        workExperiences.push({ company, jobTitle, date, descriptions });
        workExperiencesScores.push({
            companyScores,
            jobTitleScores,
            dateScores,
        });
    }
    return { workExperiences, workExperiencesScores };
};
exports.extractWorkExperience = extractWorkExperience;
