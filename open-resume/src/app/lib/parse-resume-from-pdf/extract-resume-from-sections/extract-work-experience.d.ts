import type { ResumeSectionToLines } from "lib/parse-resume-from-pdf/types";
export declare const extractWorkExperience: (sections: ResumeSectionToLines) => {
    workExperiences: ResumeWorkExperience[];
    workExperiencesScores: {
        companyScores: any;
        jobTitleScores: any;
        dateScores: any;
    }[];
};
