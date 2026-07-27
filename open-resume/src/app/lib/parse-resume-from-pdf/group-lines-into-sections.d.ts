import type { ResumeKey } from "lib/redux/types";
import type { Lines } from "lib/parse-resume-from-pdf/types";
export declare const PROFILE_SECTION: ResumeKey;
/**
 * Step 3. Group lines into sections
 *
 * Every section (except the profile section) starts with a section title that
 * takes up the entire line. This is a common pattern not just in resumes but
 * also in books and blogs. The resume parser uses this pattern to group lines
 * into the closest section title above these lines.
 */
export declare const groupLinesIntoSections: (lines: Lines) => ResumeSectionToLines;
