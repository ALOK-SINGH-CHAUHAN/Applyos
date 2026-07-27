"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomForm = void 0;
const Form_1 = require("components/ResumeForm/Form");
const IconButton_1 = require("components/ResumeForm/Form/IconButton");
const InputGroup_1 = require("components/ResumeForm/Form/InputGroup");
const hooks_1 = require("lib/redux/hooks");
const resumeSlice_1 = require("lib/redux/resumeSlice");
const settingsSlice_1 = require("lib/redux/settingsSlice");
const CustomForm = () => {
    const custom = (0, hooks_1.useAppSelector)(resumeSlice_1.selectCustom);
    const dispatch = (0, hooks_1.useAppDispatch)();
    const { descriptions } = custom;
    const form = "custom";
    const showBulletPoints = (0, hooks_1.useAppSelector)((0, settingsSlice_1.selectShowBulletPoints)(form));
    const handleCustomChange = (field, value) => {
        dispatch((0, resumeSlice_1.changeCustom)({ field, value }));
    };
    const handleShowBulletPoints = (value) => {
        dispatch((0, settingsSlice_1.changeShowBulletPoints)({ field: form, value }));
    };
    return (<Form_1.Form form={form}>
      <div className="col-span-full grid grid-cols-6 gap-3">
        <div className="relative col-span-full">
          <InputGroup_1.BulletListTextarea label="Custom Textbox" labelClassName="col-span-full" name="descriptions" placeholder="Bullet points" value={descriptions} onChange={handleCustomChange} showBulletPoints={showBulletPoints}/>
          <div className="absolute left-[7.7rem] top-[0.07rem]">
            <IconButton_1.BulletListIconButton showBulletPoints={showBulletPoints} onClick={handleShowBulletPoints}/>
          </div>
        </div>
      </div>
    </Form_1.Form>);
};
exports.CustomForm = CustomForm;
