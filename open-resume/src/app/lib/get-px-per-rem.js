"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPxPerRem = void 0;
const getPxPerRem = () => {
    const bodyComputedStyle = getComputedStyle(document.querySelector("body"));
    return parseFloat(bodyComputedStyle["font-size"]) || 16;
};
exports.getPxPerRem = getPxPerRem;
