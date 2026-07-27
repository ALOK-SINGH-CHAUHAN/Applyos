"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useRegisterReactPDFHyphenationCallback = exports.useRegisterReactPDFFont = void 0;
const react_1 = require("react");
const renderer_1 = require("@react-pdf/renderer");
const constants_1 = require("components/fonts/constants");
const lib_1 = require("components/fonts/lib");
/**
 * Register all fonts to React PDF so it can render fonts correctly in PDF
 */
const useRegisterReactPDFFont = () => {
    (0, react_1.useEffect)(() => {
        const allFontFamilies = (0, lib_1.getAllFontFamiliesToLoad)();
        allFontFamilies.forEach((fontFamily) => {
            renderer_1.Font.register({
                family: fontFamily,
                fonts: [
                    {
                        src: `fonts/${fontFamily}-Regular.ttf`,
                    },
                    {
                        src: `fonts/${fontFamily}-Bold.ttf`,
                        fontWeight: "bold",
                    },
                ],
            });
        });
    }, []);
};
exports.useRegisterReactPDFFont = useRegisterReactPDFFont;
const useRegisterReactPDFHyphenationCallback = (fontFamily) => {
    (0, react_1.useEffect)(() => {
        if (constants_1.ENGLISH_FONT_FAMILIES.includes(fontFamily)) {
            // Disable hyphenation for English Font Family so the word wraps each line
            // https://github.com/diegomura/react-pdf/issues/311#issuecomment-548301604
            renderer_1.Font.registerHyphenationCallback((word) => [word]);
        }
        else {
            // React PDF doesn't understand how to wrap non-english word on line break
            // A workaround is to add an empty character after each word
            // Reference https://github.com/diegomura/react-pdf/issues/1568
            renderer_1.Font.registerHyphenationCallback((word) => word
                .split("")
                .map((char) => [char, ""])
                .flat());
        }
    }, [fontFamily]);
};
exports.useRegisterReactPDFHyphenationCallback = useRegisterReactPDFHyphenationCallback;
