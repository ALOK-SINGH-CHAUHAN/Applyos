"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectsForm = void 0;
const Form_1 = require("components/ResumeForm/Form");
const InputGroup_1 = require("components/ResumeForm/Form/InputGroup");
const hooks_1 = require("lib/redux/hooks");
const resumeSlice_1 = require("lib/redux/resumeSlice");
const ProjectsForm = () => {
    const projects = (0, hooks_1.useAppSelector)(resumeSlice_1.selectProjects);
    const dispatch = (0, hooks_1.useAppDispatch)();
    const showDelete = projects.length > 1;
    return (<Form_1.Form form="projects" addButtonText="Add Project">
      {projects.map(({ project, date, descriptions }, idx) => {
            const handleProjectChange = (...[field, value,]) => {
                dispatch((0, resumeSlice_1.changeProjects)({ idx, field, value }));
            };
            const showMoveUp = idx !== 0;
            const showMoveDown = idx !== projects.length - 1;
            return (<Form_1.FormSection key={idx} form="projects" idx={idx} showMoveUp={showMoveUp} showMoveDown={showMoveDown} showDelete={showDelete} deleteButtonTooltipText={"Delete project"}>
            <InputGroup_1.Input name="project" label="Project Name" placeholder="OpenResume" value={project} onChange={handleProjectChange} labelClassName="col-span-4"/>
            <InputGroup_1.Input name="date" label="Date" placeholder="Winter 2022" value={date} onChange={handleProjectChange} labelClassName="col-span-2"/>
            <InputGroup_1.BulletListTextarea name="descriptions" label="Description" placeholder="Bullet points" value={descriptions} onChange={handleProjectChange} labelClassName="col-span-full"/>
          </Form_1.FormSection>);
        })}
    </Form_1.Form>);
};
exports.ProjectsForm = ProjectsForm;
