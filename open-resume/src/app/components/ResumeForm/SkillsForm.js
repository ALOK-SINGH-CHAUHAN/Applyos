"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkillsForm = void 0;
const Form_1 = require("components/ResumeForm/Form");
const InputGroup_1 = require("components/ResumeForm/Form/InputGroup");
const FeaturedSkillInput_1 = require("components/ResumeForm/Form/FeaturedSkillInput");
const IconButton_1 = require("components/ResumeForm/Form/IconButton");
const hooks_1 = require("lib/redux/hooks");
const resumeSlice_1 = require("lib/redux/resumeSlice");
const settingsSlice_1 = require("lib/redux/settingsSlice");
const SkillsForm = () => {
    const skills = (0, hooks_1.useAppSelector)(resumeSlice_1.selectSkills);
    const dispatch = (0, hooks_1.useAppDispatch)();
    const { featuredSkills, descriptions } = skills;
    const form = "skills";
    const showBulletPoints = (0, hooks_1.useAppSelector)((0, settingsSlice_1.selectShowBulletPoints)(form));
    const themeColor = (0, hooks_1.useAppSelector)(settingsSlice_1.selectThemeColor) || "#38bdf8";
    const handleSkillsChange = (field, value) => {
        dispatch((0, resumeSlice_1.changeSkills)({ field, value }));
    };
    const handleFeaturedSkillsChange = (idx, skill, rating) => {
        dispatch((0, resumeSlice_1.changeSkills)({ field: "featuredSkills", idx, skill, rating }));
    };
    const handleShowBulletPoints = (value) => {
        dispatch((0, settingsSlice_1.changeShowBulletPoints)({ field: form, value }));
    };
    return (<Form_1.Form form={form}>
      <div className="col-span-full grid grid-cols-6 gap-3">
        <div className="relative col-span-full">
          <InputGroup_1.BulletListTextarea label="Skills List" labelClassName="col-span-full" name="descriptions" placeholder="Bullet points" value={descriptions} onChange={handleSkillsChange} showBulletPoints={showBulletPoints}/>
          <div className="absolute left-[4.5rem] top-[0.07rem]">
            <IconButton_1.BulletListIconButton showBulletPoints={showBulletPoints} onClick={handleShowBulletPoints}/>
          </div>
        </div>
        <div className="col-span-full mb-4 mt-6 border-t-2 border-dotted border-gray-200"/>
        <InputGroup_1.InputGroupWrapper label="Featured Skills (Optional)" className="col-span-full">
          <p className="mt-2 text-sm font-normal text-gray-600">
            Featured skills is optional to highlight top skills, with more
            circles mean higher proficiency.
          </p>
        </InputGroup_1.InputGroupWrapper>

        {featuredSkills.map(({ skill, rating }, idx) => (<FeaturedSkillInput_1.FeaturedSkillInput key={idx} className="col-span-3" skill={skill} rating={rating} setSkillRating={(newSkill, newRating) => {
                handleFeaturedSkillsChange(idx, newSkill, newRating);
            }} placeholder={`Featured Skill ${idx + 1}`} circleColor={themeColor}/>))}
      </div>
    </Form_1.Form>);
};
exports.SkillsForm = SkillsForm;
