import type { RootState } from "lib/redux/store";
import type { FeaturedSkill, Resume, ResumeEducation, ResumeProfile, ResumeProject, ResumeSkills, ResumeWorkExperience } from "lib/redux/types";
export declare const initialProfile: ResumeProfile;
export declare const initialWorkExperience: ResumeWorkExperience;
export declare const initialEducation: ResumeEducation;
export declare const initialProject: ResumeProject;
export declare const initialFeaturedSkill: FeaturedSkill;
export declare const initialFeaturedSkills: FeaturedSkill[];
export declare const initialSkills: ResumeSkills;
export declare const initialCustom: {
    descriptions: never[];
};
export declare const initialResumeState: Resume;
export type CreateChangeActionWithDescriptions<T> = {
    idx: number;
} & ({
    field: Exclude<keyof T, "descriptions">;
    value: string;
} | {
    field: "descriptions";
    value: string[];
});
export declare const resumeSlice: any;
export declare const changeProfile: any, changeWorkExperiences: any, changeEducations: any, changeProjects: any, changeSkills: any, changeCustom: any, addSectionInForm: any, moveSectionInForm: any, deleteSectionInFormByIdx: any, setResume: any;
export declare const selectResume: (state: RootState) => any;
export declare const selectProfile: (state: RootState) => any;
export declare const selectWorkExperiences: (state: RootState) => any;
export declare const selectEducations: (state: RootState) => any;
export declare const selectProjects: (state: RootState) => any;
export declare const selectSkills: (state: RootState) => any;
export declare const selectCustom: (state: RootState) => any;
declare const _default: any;
export default _default;
