"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkExperiencesForm = void 0;
const Form_1 = require("components/ResumeForm/Form");
const InputGroup_1 = require("components/ResumeForm/Form/InputGroup");
const hooks_1 = require("lib/redux/hooks");
const resumeSlice_1 = require("lib/redux/resumeSlice");
const WorkExperiencesForm = () => {
    const workExperiences = (0, hooks_1.useAppSelector)(resumeSlice_1.selectWorkExperiences);
    const dispatch = (0, hooks_1.useAppDispatch)();
    const showDelete = workExperiences.length > 1;
    return (<Form_1.Form form="workExperiences" addButtonText="Add Job">
      {workExperiences.map(({ company, jobTitle, date, descriptions }, idx) => {
            const handleWorkExperienceChange = (...[field, value,]) => {
                // TS doesn't support passing union type to single call signature
                // https://github.com/microsoft/TypeScript/issues/54027
                // any is used here as a workaround
                dispatch((0, resumeSlice_1.changeWorkExperiences)({ idx, field, value }));
            };
            const showMoveUp = idx !== 0;
            const showMoveDown = idx !== workExperiences.length - 1;
            return (<Form_1.FormSection key={idx} form="workExperiences" idx={idx} showMoveUp={showMoveUp} showMoveDown={showMoveDown} showDelete={showDelete} deleteButtonTooltipText="Delete job">
            <InputGroup_1.Input label="Company" labelClassName="col-span-full" name="company" placeholder="Khan Academy" value={company} onChange={handleWorkExperienceChange}/>
            <InputGroup_1.Input label="Job Title" labelClassName="col-span-4" name="jobTitle" placeholder="Software Engineer" value={jobTitle} onChange={handleWorkExperienceChange}/>
            <InputGroup_1.Input label="Date" labelClassName="col-span-2" name="date" placeholder="Jun 2022 - Present" value={date} onChange={handleWorkExperienceChange}/>
            <InputGroup_1.BulletListTextarea label="Description" labelClassName="col-span-full" name="descriptions" placeholder="Bullet points" value={descriptions} onChange={handleWorkExperienceChange}/>
          </Form_1.FormSection>);
        })}
    </Form_1.Form>);
};
exports.WorkExperiencesForm = WorkExperiencesForm;
