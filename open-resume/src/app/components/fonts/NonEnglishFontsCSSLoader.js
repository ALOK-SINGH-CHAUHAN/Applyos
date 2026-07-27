"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NonEnglishFontsCSSLazyLoader = void 0;
const react_1 = require("react");
const dynamic_1 = __importDefault(require("next/dynamic"));
const lib_1 = require("components/fonts/lib");
const FontsZhCSR = (0, dynamic_1.default)(() => import("components/fonts/FontsZh"), {
    ssr: false,
});
/**
 * Empty component to lazy load non-english fonts CSS conditionally
 *
 * Reference: https://prawira.medium.com/react-conditional-import-conditional-css-import-110cc58e0da6
 */
const NonEnglishFontsCSSLazyLoader = () => {
    const [shouldLoadFontsZh, setShouldLoadFontsZh] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        if ((0, lib_1.getAllFontFamiliesToLoad)().includes("NotoSansSC")) {
            setShouldLoadFontsZh(true);
        }
    }, []);
    return <>{shouldLoadFontsZh && <FontsZhCSR />}</>;
};
exports.NonEnglishFontsCSSLazyLoader = NonEnglishFontsCSSLazyLoader;
