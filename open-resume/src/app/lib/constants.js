"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEBUG_RESUME_PDF_FLAG = exports.A4_HEIGHT_PX = exports.A4_WIDTH_PX = exports.A4_WIDTH_PT = exports.LETTER_HEIGHT_PX = exports.LETTER_WIDTH_PX = exports.LETTER_WIDTH_PT = exports.PX_PER_PT = void 0;
exports.PX_PER_PT = 4 / 3;
// Reference: https://www.prepressure.com/library/paper-size/letter
// Letter size is commonly used in US & Canada, while A4 is the standard for rest of world.
exports.LETTER_WIDTH_PT = 612;
const LETTER_HEIGHT_PT = 792;
exports.LETTER_WIDTH_PX = exports.LETTER_WIDTH_PT * exports.PX_PER_PT;
exports.LETTER_HEIGHT_PX = LETTER_HEIGHT_PT * exports.PX_PER_PT;
// Reference: https://www.prepressure.com/library/paper-size/din-a4
exports.A4_WIDTH_PT = 595;
const A4_HEIGHT_PT = 842;
exports.A4_WIDTH_PX = exports.A4_WIDTH_PT * exports.PX_PER_PT;
exports.A4_HEIGHT_PX = A4_HEIGHT_PT * exports.PX_PER_PT;
exports.DEBUG_RESUME_PDF_FLAG = undefined; // use undefined to disable to deal with a weird error message
