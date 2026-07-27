"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectCustom = exports.selectSkills = exports.selectProjects = exports.selectEducations = exports.selectWorkExperiences = exports.selectProfile = exports.selectResume = exports.setResume = exports.deleteSectionInFormByIdx = exports.moveSectionInForm = exports.addSectionInForm = exports.changeCustom = exports.changeSkills = exports.changeProjects = exports.changeEducations = exports.changeWorkExperiences = exports.changeProfile = exports.resumeSlice = exports.initialResumeState = exports.initialCustom = exports.initialSkills = exports.initialFeaturedSkills = exports.initialFeaturedSkill = exports.initialProject = exports.initialEducation = exports.initialWorkExperience = exports.initialProfile = void 0;
const toolkit_1 = require("@reduxjs/toolkit");
exports.initialProfile = {
    name: "",
    summary: "",
    email: "",
    phone: "",
    location: "",
    url: "",
};
exports.initialWorkExperience = {
    company: "",
    jobTitle: "",
    date: "",
    descriptions: [],
};
exports.initialEducation = {
    school: "",
    degree: "",
    gpa: "",
    date: "",
    descriptions: [],
};
exports.initialProject = {
    project: "",
    date: "",
    descriptions: [],
};
exports.initialFeaturedSkill = { skill: "", rating: 4 };
exports.initialFeaturedSkills = Array(6).fill({
    ...exports.initialFeaturedSkill,
});
exports.initialSkills = {
    featuredSkills: exports.initialFeaturedSkills,
    descriptions: [],
};
exports.initialCustom = {
    descriptions: [],
};
exports.initialResumeState = {
    profile: exports.initialProfile,
    workExperiences: [exports.initialWorkExperience],
    educations: [exports.initialEducation],
    projects: [exports.initialProject],
    skills: exports.initialSkills,
    custom: exports.initialCustom,
};
exports.resumeSlice = (0, toolkit_1.createSlice)({
    name: "resume",
    initialState: exports.initialResumeState,
    reducers: {
        changeProfile: (draft, action) => {
            const { field, value } = action.payload;
            draft.profile[field] = value;
        },
        changeWorkExperiences: (draft, action) => {
            const { idx, field, value } = action.payload;
            const workExperience = draft.workExperiences[idx];
            workExperience[field] = value;
        },
        changeEducations: (draft, action) => {
            const { idx, field, value } = action.payload;
            const education = draft.educations[idx];
            education[field] = value;
        },
        changeProjects: (draft, action) => {
            const { idx, field, value } = action.payload;
            const project = draft.projects[idx];
            project[field] = value;
        },
        changeSkills: (draft, action) => {
            const { field } = action.payload;
            if (field === "descriptions") {
                const { value } = action.payload;
                draft.skills.descriptions = value;
            }
            else {
                const { idx, skill, rating } = action.payload;
                const featuredSkill = draft.skills.featuredSkills[idx];
                featuredSkill.skill = skill;
                featuredSkill.rating = rating;
            }
        },
        changeCustom: (draft, action) => {
            const { value } = action.payload;
            draft.custom.descriptions = value;
        },
        addSectionInForm: (draft, action) => {
            const { form } = action.payload;
            switch (form) {
                case "workExperiences": {
                    draft.workExperiences.push(structuredClone(exports.initialWorkExperience));
                    return draft;
                }
                case "educations": {
                    draft.educations.push(structuredClone(exports.initialEducation));
                    return draft;
                }
                case "projects": {
                    draft.projects.push(structuredClone(exports.initialProject));
                    return draft;
                }
            }
        },
        moveSectionInForm: (draft, action) => {
            const { form, idx, direction } = action.payload;
            if (form !== "skills" && form !== "custom") {
                if ((idx === 0 && direction === "up") ||
                    (idx === draft[form].length - 1 && direction === "down")) {
                    return draft;
                }
                const section = draft[form][idx];
                if (direction === "up") {
                    draft[form][idx] = draft[form][idx - 1];
                    draft[form][idx - 1] = section;
                }
                else {
                    draft[form][idx] = draft[form][idx + 1];
                    draft[form][idx + 1] = section;
                }
            }
        },
        deleteSectionInFormByIdx: (draft, action) => {
            const { form, idx } = action.payload;
            if (form !== "skills" && form !== "custom") {
                draft[form].splice(idx, 1);
            }
        },
        setResume: (draft, action) => {
            return action.payload;
        },
    },
});
_a = exports.resumeSlice.actions, exports.changeProfile = _a.changeProfile, exports.changeWorkExperiences = _a.changeWorkExperiences, exports.changeEducations = _a.changeEducations, exports.changeProjects = _a.changeProjects, exports.changeSkills = _a.changeSkills, exports.changeCustom = _a.changeCustom, exports.addSectionInForm = _a.addSectionInForm, exports.moveSectionInForm = _a.moveSectionInForm, exports.deleteSectionInFormByIdx = _a.deleteSectionInFormByIdx, exports.setResume = _a.setResume;
const selectResume = (state) => state.resume;
exports.selectResume = selectResume;
const selectProfile = (state) => state.resume.profile;
exports.selectProfile = selectProfile;
const selectWorkExperiences = (state) => state.resume.workExperiences;
exports.selectWorkExperiences = selectWorkExperiences;
const selectEducations = (state) => state.resume.educations;
exports.selectEducations = selectEducations;
const selectProjects = (state) => state.resume.projects;
exports.selectProjects = selectProjects;
const selectSkills = (state) => state.resume.skills;
exports.selectSkills = selectSkills;
const selectCustom = (state) => state.resume.custom;
exports.selectCustom = selectCustom;
exports.default = exports.resumeSlice.reducer;
