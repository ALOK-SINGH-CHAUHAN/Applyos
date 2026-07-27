"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllFontFamiliesToLoad = void 0;
const constants_1 = require("components/fonts/constants");
/**
 * getPreferredNonEnglishFontFamilies returns non-english font families that are included in
 * user's preferred languages. This is to avoid loading fonts/languages that users won't use.
 */
const getPreferredNonEnglishFontFamilies = () => {
    return constants_1.NON_ENGLISH_FONT_FAMILIES.filter((fontFamily) => {
        const fontLanguages = constants_1.NON_ENGLISH_FONT_FAMILY_TO_LANGUAGE[fontFamily];
        const userPreferredLanguages = navigator.languages ?? [navigator.language];
        return userPreferredLanguages.some((preferredLanguage) => fontLanguages.includes(preferredLanguage));
    });
};
const getAllFontFamiliesToLoad = () => {
    return [...constants_1.ENGLISH_FONT_FAMILIES, ...getPreferredNonEnglishFontFamilies()];
};
exports.getAllFontFamiliesToLoad = getAllFontFamiliesToLoad;
