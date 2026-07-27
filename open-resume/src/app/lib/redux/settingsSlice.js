"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectShowBulletPoints = exports.selectIsLastForm = exports.selectIsFirstForm = exports.selectFormsOrder = exports.selectHeadingByForm = exports.selectFormToHeading = exports.selectShowByForm = exports.selectFormToShow = exports.selectThemeColor = exports.selectSettings = exports.setSettings = exports.changeShowBulletPoints = exports.changeFormOrder = exports.changeFormHeading = exports.changeShowForm = exports.changeSettings = exports.settingsSlice = exports.initialSettings = exports.DEFAULT_FONT_COLOR = exports.DEFAULT_FONT_SIZE = exports.DEFAULT_FONT_FAMILY = exports.DEFAULT_THEME_COLOR = void 0;
const toolkit_1 = require("@reduxjs/toolkit");
exports.DEFAULT_THEME_COLOR = "#38bdf8"; // sky-400
exports.DEFAULT_FONT_FAMILY = "Roboto";
exports.DEFAULT_FONT_SIZE = "11"; // text-base https://tailwindcss.com/docs/font-size
exports.DEFAULT_FONT_COLOR = "#171717"; // text-neutral-800
exports.initialSettings = {
    themeColor: exports.DEFAULT_THEME_COLOR,
    fontFamily: exports.DEFAULT_FONT_FAMILY,
    fontSize: exports.DEFAULT_FONT_SIZE,
    documentSize: "Letter",
    formToShow: {
        workExperiences: true,
        educations: true,
        projects: true,
        skills: true,
        custom: false,
    },
    formToHeading: {
        workExperiences: "WORK EXPERIENCE",
        educations: "EDUCATION",
        projects: "PROJECT",
        skills: "SKILLS",
        custom: "CUSTOM SECTION",
    },
    formsOrder: ["workExperiences", "educations", "projects", "skills", "custom"],
    showBulletPoints: {
        educations: true,
        projects: true,
        skills: true,
        custom: true,
    },
};
exports.settingsSlice = (0, toolkit_1.createSlice)({
    name: "settings",
    initialState: exports.initialSettings,
    reducers: {
        changeSettings: (draft, action) => {
            const { field, value } = action.payload;
            draft[field] = value;
        },
        changeShowForm: (draft, action) => {
            const { field, value } = action.payload;
            draft.formToShow[field] = value;
        },
        changeFormHeading: (draft, action) => {
            const { field, value } = action.payload;
            draft.formToHeading[field] = value;
        },
        changeFormOrder: (draft, action) => {
            const { form, type } = action.payload;
            const lastIdx = draft.formsOrder.length - 1;
            const pos = draft.formsOrder.indexOf(form);
            const newPos = type === "up" ? pos - 1 : pos + 1;
            const swapFormOrder = (idx1, idx2) => {
                const temp = draft.formsOrder[idx1];
                draft.formsOrder[idx1] = draft.formsOrder[idx2];
                draft.formsOrder[idx2] = temp;
            };
            if (newPos >= 0 && newPos <= lastIdx) {
                swapFormOrder(pos, newPos);
            }
        },
        changeShowBulletPoints: (draft, action) => {
            const { field, value } = action.payload;
            draft["showBulletPoints"][field] = value;
        },
        setSettings: (draft, action) => {
            return action.payload;
        },
    },
});
_a = exports.settingsSlice.actions, exports.changeSettings = _a.changeSettings, exports.changeShowForm = _a.changeShowForm, exports.changeFormHeading = _a.changeFormHeading, exports.changeFormOrder = _a.changeFormOrder, exports.changeShowBulletPoints = _a.changeShowBulletPoints, exports.setSettings = _a.setSettings;
const selectSettings = (state) => state.settings;
exports.selectSettings = selectSettings;
const selectThemeColor = (state) => state.settings.themeColor;
exports.selectThemeColor = selectThemeColor;
const selectFormToShow = (state) => state.settings.formToShow;
exports.selectFormToShow = selectFormToShow;
const selectShowByForm = (form) => (state) => state.settings.formToShow[form];
exports.selectShowByForm = selectShowByForm;
const selectFormToHeading = (state) => state.settings.formToHeading;
exports.selectFormToHeading = selectFormToHeading;
const selectHeadingByForm = (form) => (state) => state.settings.formToHeading[form];
exports.selectHeadingByForm = selectHeadingByForm;
const selectFormsOrder = (state) => state.settings.formsOrder;
exports.selectFormsOrder = selectFormsOrder;
const selectIsFirstForm = (form) => (state) => state.settings.formsOrder[0] === form;
exports.selectIsFirstForm = selectIsFirstForm;
const selectIsLastForm = (form) => (state) => state.settings.formsOrder[state.settings.formsOrder.length - 1] === form;
exports.selectIsLastForm = selectIsLastForm;
const selectShowBulletPoints = (form) => (state) => state.settings.showBulletPoints[form];
exports.selectShowBulletPoints = selectShowBulletPoints;
exports.default = exports.settingsSlice.reducer;
