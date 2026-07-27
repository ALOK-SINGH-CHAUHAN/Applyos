"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EducationsForm = void 0;
const Form_1 = require("components/ResumeForm/Form");
const InputGroup_1 = require("components/ResumeForm/Form/InputGroup");
const IconButton_1 = require("components/ResumeForm/Form/IconButton");
const hooks_1 = require("lib/redux/hooks");
const resumeSlice_1 = require("lib/redux/resumeSlice");
const settingsSlice_1 = require("lib/redux/settingsSlice");
const EducationsForm = () => {
    const educations = (0, hooks_1.useAppSelector)(resumeSlice_1.selectEducations);
    const dispatch = (0, hooks_1.useAppDispatch)();
    const showDelete = educations.length > 1;
    const form = "educations";
    const showBulletPoints = (0, hooks_1.useAppSelector)((0, settingsSlice_1.selectShowBulletPoints)(form));
    return (<Form_1.Form form={form} addButtonText="Add School">
      {educations.map(({ school, degree, gpa, date, descriptions }, idx) => {
            const handleEducationChange = (...[field, value,]) => {
                dispatch((0, resumeSlice_1.changeEducations)({ idx, field, value }));
            };
            const handleShowBulletPoints = (value) => {
                dispatch((0, settingsSlice_1.changeShowBulletPoints)({ field: form, value }));
            };
            const showMoveUp = idx !== 0;
            const showMoveDown = idx !== educations.length - 1;
            return (<Form_1.FormSection key={idx} form="educations" idx={idx} showMoveUp={showMoveUp} showMoveDown={showMoveDown} showDelete={showDelete} deleteButtonTooltipText="Delete school">
            <InputGroup_1.Input label="School" labelClassName="col-span-4" name="school" placeholder="Cornell University" value={school} onChange={handleEducationChange}/>
            <InputGroup_1.Input label="Date" labelClassName="col-span-2" name="date" placeholder="May 2018" value={date} onChange={handleEducationChange}/>
            <InputGroup_1.Input label="Degree & Major" labelClassName="col-span-4" name="degree" placeholder="Bachelor of Science in Computer Engineering" value={degree} onChange={handleEducationChange}/>
            <InputGroup_1.Input label="GPA" labelClassName="col-span-2" name="gpa" placeholder="3.81" value={gpa} onChange={handleEducationChange}/>
            <div className="relative col-span-full">
              <InputGroup_1.BulletListTextarea label="Additional Information (Optional)" labelClassName="col-span-full" name="descriptions" placeholder="Free paragraph space to list out additional activities, courses, awards etc" value={descriptions} onChange={handleEducationChange} showBulletPoints={showBulletPoints}/>
              <div className="absolute left-[15.6rem] top-[0.07rem]">
                <IconButton_1.BulletListIconButton showBulletPoints={showBulletPoints} onClick={handleShowBulletPoints}/>
              </div>
            </div>
          </Form_1.FormSection>);
        })}
    </Form_1.Form>);
};
exports.EducationsForm = EducationsForm;
