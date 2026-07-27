import type { ResumeSectionToLines } from "lib/parse-resume-from-pdf/types";
export declare const extractProject: (sections: ResumeSectionToLines) => {
    projects: ResumeProject[];
    projectsScores: {
        projectScores: any;
        dateScores: any;
    }[];
};
