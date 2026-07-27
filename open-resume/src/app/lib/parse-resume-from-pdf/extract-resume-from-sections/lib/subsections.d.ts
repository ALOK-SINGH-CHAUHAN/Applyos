import type { Lines, Subsections } from "lib/parse-resume-from-pdf/types";
/**
 * Divide lines into subsections based on difference in line gap or bold text.
 *
 * For profile section, we can directly pass all the text items to the feature
 * scoring systems. But for other sections, such as education and work experience,
 * we have to first divide the section into subsections since there can be multiple
 * schools or work experiences in the section. The feature scoring system then
 * process each subsection to retrieve each's resume attributes and append the results.
 */
export declare const divideSectionIntoSubsections: (lines: Lines) => Subsections;
