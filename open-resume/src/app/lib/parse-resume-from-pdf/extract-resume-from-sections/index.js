"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractResumeFromSections = void 0;
const extract_profile_1 = require("lib/parse-resume-from-pdf/extract-resume-from-sections/extract-profile");
const extract_education_1 = require("lib/parse-resume-from-pdf/extract-resume-from-sections/extract-education");
const extract_work_experience_1 = require("lib/parse-resume-from-pdf/extract-resume-from-sections/extract-work-experience");
const extract_project_1 = require("lib/parse-resume-from-pdf/extract-resume-from-sections/extract-project");
const extract_skills_1 = require("lib/parse-resume-from-pdf/extract-resume-from-sections/extract-skills");
/**
 * Step 4. Extract resume from sections.
 *
 * This is the core of the resume parser to resume information from the sections.
 *
 * The gist of the extraction engine is a feature scoring system. Each resume attribute
 * to be extracted has a custom feature sets, where each feature set consists of a
 * feature matching function and a feature matching score if matched (feature matching
 * score can be a positive or negative number). To compute the final feature score of
 * a text item for a particular resume attribute, it would run the text item through
 * all its feature sets and sum up the matching feature scores. This process is carried
 * out for all text items within the section, and the text item with the highest computed
 * feature score is identified as the extracted resume attribute.
 */
const extractResumeFromSections = (sections) => {
    const { profile } = (0, extract_profile_1.extractProfile)(sections);
    const { educations } = (0, extract_education_1.extractEducation)(sections);
    const { workExperiences } = (0, extract_work_experience_1.extractWorkExperience)(sections);
    const { projects } = (0, extract_project_1.extractProject)(sections);
    const { skills } = (0, extract_skills_1.extractSkills)(sections);
    return {
        profile,
        educations,
        workExperiences,
        projects,
        skills,
        custom: {
            descriptions: [],
        },
    };
};
exports.extractResumeFromSections = extractResumeFromSections;
