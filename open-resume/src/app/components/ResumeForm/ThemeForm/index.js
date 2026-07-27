"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThemeForm = void 0;
const Form_1 = require("components/ResumeForm/Form");
const InputGroup_1 = require("components/ResumeForm/Form/InputGroup");
const constants_1 = require("components/ResumeForm/ThemeForm/constants");
const InlineInput_1 = require("components/ResumeForm/ThemeForm/InlineInput");
const Selection_1 = require("components/ResumeForm/ThemeForm/Selection");
const settingsSlice_1 = require("lib/redux/settingsSlice");
const hooks_1 = require("lib/redux/hooks");
const outline_1 = require("@heroicons/react/24/outline");
const ThemeForm = () => {
    const settings = (0, hooks_1.useAppSelector)(settingsSlice_1.selectSettings);
    const { fontSize, fontFamily, documentSize } = settings;
    const themeColor = settings.themeColor || settingsSlice_1.DEFAULT_THEME_COLOR;
    const dispatch = (0, hooks_1.useAppDispatch)();
    const handleSettingsChange = (field, value) => {
        dispatch((0, settingsSlice_1.changeSettings)({ field, value }));
    };
    return (<Form_1.BaseForm>
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <outline_1.Cog6ToothIcon className="h-6 w-6 text-gray-600" aria-hidden="true"/>
          <h1 className="text-lg font-semibold tracking-wide text-gray-900 ">
            Resume Setting
          </h1>
        </div>
        <div>
          <InlineInput_1.InlineInput label="Theme Color" name="themeColor" value={settings.themeColor} placeholder={settingsSlice_1.DEFAULT_THEME_COLOR} onChange={handleSettingsChange} inputStyle={{ color: themeColor }}/>
          <div className="mt-2 flex flex-wrap gap-2">
            {constants_1.THEME_COLORS.map((color, idx) => (<div className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md text-sm text-white" style={{ backgroundColor: color }} key={idx} onClick={() => handleSettingsChange("themeColor", color)} onKeyDown={(e) => {
                if (["Enter", " "].includes(e.key))
                    handleSettingsChange("themeColor", color);
            }} tabIndex={0}>
                {settings.themeColor === color ? "✓" : ""}
              </div>))}
          </div>
        </div>
        <div>
          <InputGroup_1.InputGroupWrapper label="Font Family"/>
          <Selection_1.FontFamilySelectionsCSR selectedFontFamily={fontFamily} themeColor={themeColor} handleSettingsChange={handleSettingsChange}/>
        </div>
        <div>
          <InlineInput_1.InlineInput label="Font Size (pt)" name="fontSize" value={fontSize} placeholder="11" onChange={handleSettingsChange}/>
          <Selection_1.FontSizeSelections fontFamily={fontFamily} themeColor={themeColor} selectedFontSize={fontSize} handleSettingsChange={handleSettingsChange}/>
        </div>
        <div>
          <InputGroup_1.InputGroupWrapper label="Document Size"/>
          <Selection_1.DocumentSizeSelections themeColor={themeColor} selectedDocumentSize={documentSize} handleSettingsChange={handleSettingsChange}/>
        </div>
      </div>
    </Form_1.BaseForm>);
};
exports.ThemeForm = ThemeForm;
