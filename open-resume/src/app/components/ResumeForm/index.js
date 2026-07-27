"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResumeForm = void 0;
const react_1 = require("react");
const hooks_1 = require("lib/redux/hooks");
const settingsSlice_1 = require("lib/redux/settingsSlice");
const ProfileForm_1 = require("components/ResumeForm/ProfileForm");
const WorkExperiencesForm_1 = require("components/ResumeForm/WorkExperiencesForm");
const EducationsForm_1 = require("components/ResumeForm/EducationsForm");
const ProjectsForm_1 = require("components/ResumeForm/ProjectsForm");
const SkillsForm_1 = require("components/ResumeForm/SkillsForm");
const ThemeForm_1 = require("components/ResumeForm/ThemeForm");
const CustomForm_1 = require("components/ResumeForm/CustomForm");
const FlexboxSpacer_1 = require("components/FlexboxSpacer");
const cx_1 = require("lib/cx");
const formTypeToComponent = {
    workExperiences: WorkExperiencesForm_1.WorkExperiencesForm,
    educations: EducationsForm_1.EducationsForm,
    projects: ProjectsForm_1.ProjectsForm,
    skills: SkillsForm_1.SkillsForm,
    custom: CustomForm_1.CustomForm,
};
const ResumeForm = () => {
    (0, hooks_1.useSetInitialStore)();
    (0, hooks_1.useSaveStateToLocalStorageOnChange)();
    const formsOrder = (0, hooks_1.useAppSelector)(settingsSlice_1.selectFormsOrder);
    const [isHover, setIsHover] = (0, react_1.useState)(false);
    return (<div className={(0, cx_1.cx)("flex justify-center scrollbar-thin scrollbar-track-gray-100 md:h-[calc(100vh-var(--top-nav-bar-height))] md:justify-end md:overflow-y-scroll", isHover ? "scrollbar-thumb-gray-200" : "scrollbar-thumb-gray-100")} onMouseOver={() => setIsHover(true)} onMouseLeave={() => setIsHover(false)}>
      <section className="flex max-w-2xl flex-col gap-8 p-[var(--resume-padding)]">
        <ProfileForm_1.ProfileForm />
        {formsOrder.map((form) => {
            const Component = formTypeToComponent[form];
            return <Component key={form}/>;
        })}
        <ThemeForm_1.ThemeForm />
        <br />
      </section>
      <FlexboxSpacer_1.FlexboxSpacer maxWidth={50} className="hidden md:block"/>
    </div>);
};
exports.ResumeForm = ResumeForm;
