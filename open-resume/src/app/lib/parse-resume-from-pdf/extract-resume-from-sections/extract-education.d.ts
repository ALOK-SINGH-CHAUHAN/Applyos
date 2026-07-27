import type { ResumeSectionToLines } from "lib/parse-resume-from-pdf/types";
export declare const extractEducation: (sections: ResumeSectionToLines) => {
    educations: ResumeEducation[];
    educationsScores: {
        schoolScores: any;
        degreeScores: any;
        gpaScores: any;
        dateScores: any;
    }[];
};
