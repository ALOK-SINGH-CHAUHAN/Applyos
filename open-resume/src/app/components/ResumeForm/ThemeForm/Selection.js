"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentSizeSelections = exports.FontSizeSelections = exports.FontFamilySelectionsCSR = void 0;
const constants_1 = require("lib/constants");
const constants_2 = require("components/fonts/constants");
const lib_1 = require("components/fonts/lib");
const dynamic_1 = __importDefault(require("next/dynamic"));
const Selection = ({ selectedColor, isSelected, style = {}, onClick, children, }) => {
    const selectedStyle = {
        color: "white",
        backgroundColor: selectedColor,
        borderColor: selectedColor,
        ...style,
    };
    return (<div className="flex w-[105px] cursor-pointer items-center justify-center rounded-md border border-gray-300 py-1.5 shadow-sm hover:border-gray-400 hover:bg-gray-100" onClick={onClick} style={isSelected ? selectedStyle : style} onKeyDown={(e) => {
            if (["Enter", " "].includes(e.key))
                onClick();
        }} tabIndex={0}>
      {children}
    </div>);
};
const SelectionsWrapper = ({ children }) => {
    return <div className="mt-2 flex flex-wrap gap-3">{children}</div>;
};
const FontFamilySelections = ({ selectedFontFamily, themeColor, handleSettingsChange, }) => {
    const allFontFamilies = (0, lib_1.getAllFontFamiliesToLoad)();
    return (<SelectionsWrapper>
      {allFontFamilies.map((fontFamily, idx) => {
            const isSelected = selectedFontFamily === fontFamily;
            const standardSizePt = constants_2.FONT_FAMILY_TO_STANDARD_SIZE_IN_PT[fontFamily];
            return (<Selection key={idx} selectedColor={themeColor} isSelected={isSelected} style={{
                    fontFamily,
                    fontSize: `${standardSizePt * constants_1.PX_PER_PT}px`,
                }} onClick={() => handleSettingsChange("fontFamily", fontFamily)}>
            {constants_2.FONT_FAMILY_TO_DISPLAY_NAME[fontFamily]}
          </Selection>);
        })}
    </SelectionsWrapper>);
};
/**
 * Load FontFamilySelections client side since it calls getAllFontFamiliesToLoad,
 * which uses navigator object that is only available on client side
 */
exports.FontFamilySelectionsCSR = (0, dynamic_1.default)(() => Promise.resolve(FontFamilySelections), {
    ssr: false,
});
const FontSizeSelections = ({ selectedFontSize, fontFamily, themeColor, handleSettingsChange, }) => {
    const standardSizePt = constants_2.FONT_FAMILY_TO_STANDARD_SIZE_IN_PT[fontFamily];
    const compactSizePt = standardSizePt - 1;
    return (<SelectionsWrapper>
      {["Compact", "Standard", "Large"].map((type, idx) => {
            const fontSizePt = String(compactSizePt + idx);
            const isSelected = fontSizePt === selectedFontSize;
            return (<Selection key={idx} selectedColor={themeColor} isSelected={isSelected} style={{
                    fontFamily,
                    fontSize: `${Number(fontSizePt) * constants_1.PX_PER_PT}px`,
                }} onClick={() => handleSettingsChange("fontSize", fontSizePt)}>
            {type}
          </Selection>);
        })}
    </SelectionsWrapper>);
};
exports.FontSizeSelections = FontSizeSelections;
const DocumentSizeSelections = ({ selectedDocumentSize, themeColor, handleSettingsChange, }) => {
    return (<SelectionsWrapper>
      {["Letter", "A4"].map((type, idx) => {
            return (<Selection key={idx} selectedColor={themeColor} isSelected={type === selectedDocumentSize} onClick={() => handleSettingsChange("documentSize", type)}>
            <div className="flex flex-col items-center">
              <div>{type}</div>
              <div className="text-xs">
                {type === "Letter" ? "(US, Canada)" : "(other countries)"}
              </div>
            </div>
          </Selection>);
        })}
    </SelectionsWrapper>);
};
exports.DocumentSizeSelections = DocumentSizeSelections;
