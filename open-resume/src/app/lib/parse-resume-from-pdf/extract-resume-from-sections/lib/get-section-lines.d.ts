import type { ResumeSectionToLines } from "lib/parse-resume-from-pdf/types";
/**
 * Return section lines that contain any of the keywords.
 */
export declare const getSectionLinesByKeywords: (sections: ResumeSectionToLines, keywords: string[]) => any;
