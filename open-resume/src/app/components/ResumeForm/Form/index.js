"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormSection = exports.Form = exports.BaseForm = void 0;
const ExpanderWithHeightTransition_1 = require("components/ExpanderWithHeightTransition");
const IconButton_1 = require("components/ResumeForm/Form/IconButton");
const hooks_1 = require("lib/redux/hooks");
const settingsSlice_1 = require("lib/redux/settingsSlice");
const outline_1 = require("@heroicons/react/24/outline");
const resumeSlice_1 = require("lib/redux/resumeSlice");
/**
 * BaseForm is the bare bone form, i.e. just the outline with no title and no control buttons.
 * ProfileForm uses this to compose its outline.
 */
const BaseForm = ({ children, className, }) => (<section className={`flex flex-col gap-3 rounded-md bg-white p-6 pt-4 shadow transition-opacity duration-200 ${className}`}>
    {children}
  </section>);
exports.BaseForm = BaseForm;
const FORM_TO_ICON = {
    workExperiences: outline_1.BuildingOfficeIcon,
    educations: outline_1.AcademicCapIcon,
    projects: outline_1.LightBulbIcon,
    skills: outline_1.WrenchIcon,
    custom: outline_1.WrenchIcon,
};
const Form = ({ form, addButtonText, children, }) => {
    const showForm = (0, hooks_1.useAppSelector)((0, settingsSlice_1.selectShowByForm)(form));
    const heading = (0, hooks_1.useAppSelector)((0, settingsSlice_1.selectHeadingByForm)(form));
    const dispatch = (0, hooks_1.useAppDispatch)();
    const setShowForm = (showForm) => {
        dispatch((0, settingsSlice_1.changeShowForm)({ field: form, value: showForm }));
    };
    const setHeading = (heading) => {
        dispatch((0, settingsSlice_1.changeFormHeading)({ field: form, value: heading }));
    };
    const isFirstForm = (0, hooks_1.useAppSelector)((0, settingsSlice_1.selectIsFirstForm)(form));
    const isLastForm = (0, hooks_1.useAppSelector)((0, settingsSlice_1.selectIsLastForm)(form));
    const handleMoveClick = (type) => {
        dispatch((0, settingsSlice_1.changeFormOrder)({ form, type }));
    };
    const Icon = FORM_TO_ICON[form];
    return (<exports.BaseForm className={`transition-opacity duration-200 ${showForm ? "pb-6" : "pb-2 opacity-60"}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex grow items-center gap-2">
          <Icon className="h-6 w-6 text-gray-600" aria-hidden="true"/>
          <input type="text" className="block w-full border-b border-transparent text-lg font-semibold tracking-wide text-gray-900 outline-none hover:border-gray-300 hover:shadow-sm focus:border-gray-300 focus:shadow-sm" value={heading} onChange={(e) => setHeading(e.target.value)}/>
        </div>
        <div className="flex items-center gap-0.5">
          {!isFirstForm && (<IconButton_1.MoveIconButton type="up" onClick={handleMoveClick}/>)}
          {!isLastForm && (<IconButton_1.MoveIconButton type="down" onClick={handleMoveClick}/>)}
          <IconButton_1.ShowIconButton show={showForm} setShow={setShowForm}/>
        </div>
      </div>
      <ExpanderWithHeightTransition_1.ExpanderWithHeightTransition expanded={showForm}>
        {children}
      </ExpanderWithHeightTransition_1.ExpanderWithHeightTransition>
      {showForm && addButtonText && (<div className="mt-2 flex justify-end">
          <button type="button" onClick={() => {
                dispatch((0, resumeSlice_1.addSectionInForm)({ form }));
            }} className="flex items-center rounded-md bg-white py-2 pl-3 pr-4 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
            <outline_1.PlusSmallIcon className="-ml-0.5 mr-1.5 h-5 w-5 text-gray-400" aria-hidden="true"/>
            {addButtonText}
          </button>
        </div>)}
    </exports.BaseForm>);
};
exports.Form = Form;
const FormSection = ({ form, idx, showMoveUp, showMoveDown, showDelete, deleteButtonTooltipText, children, }) => {
    const dispatch = (0, hooks_1.useAppDispatch)();
    const handleDeleteClick = () => {
        dispatch((0, resumeSlice_1.deleteSectionInFormByIdx)({ form, idx }));
    };
    const handleMoveClick = (direction) => {
        dispatch((0, resumeSlice_1.moveSectionInForm)({ form, direction, idx }));
    };
    return (<>
      {idx !== 0 && (<div className="mb-4 mt-6 border-t-2 border-dotted border-gray-200"/>)}
      <div className="relative grid grid-cols-6 gap-3">
        {children}
        <div className={`absolute right-0 top-0 flex gap-0.5 `}>
          <div className={`transition-all duration-300 ${showMoveUp ? "" : "invisible opacity-0"} ${showMoveDown ? "" : "-mr-6"}`}>
            <IconButton_1.MoveIconButton type="up" size="small" onClick={() => handleMoveClick("up")}/>
          </div>
          <div className={`transition-all duration-300 ${showMoveDown ? "" : "invisible opacity-0"}`}>
            <IconButton_1.MoveIconButton type="down" size="small" onClick={() => handleMoveClick("down")}/>
          </div>
          <div className={`transition-all duration-300 ${showDelete ? "" : "invisible opacity-0"}`}>
            <IconButton_1.DeleteIconButton onClick={handleDeleteClick} tooltipText={deleteButtonTooltipText}/>
          </div>
        </div>
      </div>
    </>);
};
exports.FormSection = FormSection;
