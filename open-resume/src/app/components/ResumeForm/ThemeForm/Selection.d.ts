import type { GeneralSetting } from "lib/redux/settingsSlice";
import { type FontFamily } from "components/fonts/constants";
/**
 * Load FontFamilySelections client side since it calls getAllFontFamiliesToLoad,
 * which uses navigator object that is only available on client side
 */
export declare const FontFamilySelectionsCSR: import("react").ComponentType<{
    selectedFontFamily: string;
    themeColor: string;
    handleSettingsChange: (field: GeneralSetting, value: string) => void;
}>;
export declare const FontSizeSelections: ({ selectedFontSize, fontFamily, themeColor, handleSettingsChange, }: {
    fontFamily: FontFamily;
    themeColor: string;
    selectedFontSize: string;
    handleSettingsChange: (field: GeneralSetting, value: string) => void;
}) => import("react").JSX.Element;
export declare const DocumentSizeSelections: ({ selectedDocumentSize, themeColor, handleSettingsChange, }: {
    themeColor: string;
    selectedDocumentSize: string;
    handleSettingsChange: (field: GeneralSetting, value: string) => void;
}) => import("react").JSX.Element;
