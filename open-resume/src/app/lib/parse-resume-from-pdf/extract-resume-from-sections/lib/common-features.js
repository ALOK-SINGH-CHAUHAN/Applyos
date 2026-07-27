"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DATE_FEATURE_SETS = exports.hasLetterAndIsAllUpperCase = exports.hasOnlyLettersSpacesAmpersands = exports.getHasText = exports.hasComma = exports.hasNumber = exports.hasLetter = exports.isBold = void 0;
const isTextItemBold = (fontName) => fontName.toLowerCase().includes("bold");
const isBold = (item) => isTextItemBold(item.fontName);
exports.isBold = isBold;
const hasLetter = (item) => /[a-zA-Z]/.test(item.text);
exports.hasLetter = hasLetter;
const hasNumber = (item) => /[0-9]/.test(item.text);
exports.hasNumber = hasNumber;
const hasComma = (item) => item.text.includes(",");
exports.hasComma = hasComma;
const getHasText = (text) => (item) => item.text.includes(text);
exports.getHasText = getHasText;
const hasOnlyLettersSpacesAmpersands = (item) => /^[A-Za-z\s&]+$/.test(item.text);
exports.hasOnlyLettersSpacesAmpersands = hasOnlyLettersSpacesAmpersands;
const hasLetterAndIsAllUpperCase = (item) => (0, exports.hasLetter)(item) && item.text.toUpperCase() === item.text;
exports.hasLetterAndIsAllUpperCase = hasLetterAndIsAllUpperCase;
// Date Features
const hasYear = (item) => /(?:19|20)\d{2}/.test(item.text);
// prettier-ignore
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const hasMonth = (item) => MONTHS.some((month) => item.text.includes(month) || item.text.includes(month.slice(0, 4)));
const SEASONS = ["Summer", "Fall", "Spring", "Winter"];
const hasSeason = (item) => SEASONS.some((season) => item.text.includes(season));
const hasPresent = (item) => item.text.includes("Present");
exports.DATE_FEATURE_SETS = [
    [hasYear, 1],
    [hasMonth, 1],
    [hasSeason, 1],
    [hasPresent, 1],
    [exports.hasComma, -1],
];
