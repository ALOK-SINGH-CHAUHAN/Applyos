import type { RootState } from "lib/redux/store";
export interface Settings {
    themeColor: string;
    fontFamily: string;
    fontSize: string;
    documentSize: string;
    formToShow: {
        workExperiences: boolean;
        educations: boolean;
        projects: boolean;
        skills: boolean;
        custom: boolean;
    };
    formToHeading: {
        workExperiences: string;
        educations: string;
        projects: string;
        skills: string;
        custom: string;
    };
    formsOrder: ShowForm[];
    showBulletPoints: {
        educations: boolean;
        projects: boolean;
        skills: boolean;
        custom: boolean;
    };
}
export type ShowForm = keyof Settings["formToShow"];
export type FormWithBulletPoints = keyof Settings["showBulletPoints"];
export type GeneralSetting = Exclude<keyof Settings, "formToShow" | "formToHeading" | "formsOrder" | "showBulletPoints">;
export declare const DEFAULT_THEME_COLOR = "#38bdf8";
export declare const DEFAULT_FONT_FAMILY = "Roboto";
export declare const DEFAULT_FONT_SIZE = "11";
export declare const DEFAULT_FONT_COLOR = "#171717";
export declare const initialSettings: Settings;
export declare const settingsSlice: any;
export declare const changeSettings: any, changeShowForm: any, changeFormHeading: any, changeFormOrder: any, changeShowBulletPoints: any, setSettings: any;
export declare const selectSettings: (state: RootState) => any;
export declare const selectThemeColor: (state: RootState) => any;
export declare const selectFormToShow: (state: RootState) => any;
export declare const selectShowByForm: (form: ShowForm) => (state: RootState) => any;
export declare const selectFormToHeading: (state: RootState) => any;
export declare const selectHeadingByForm: (form: ShowForm) => (state: RootState) => any;
export declare const selectFormsOrder: (state: RootState) => any;
export declare const selectIsFirstForm: (form: ShowForm) => (state: RootState) => boolean;
export declare const selectIsLastForm: (form: ShowForm) => (state: RootState) => boolean;
export declare const selectShowBulletPoints: (form: FormWithBulletPoints) => (state: RootState) => any;
declare const _default: any;
export default _default;
