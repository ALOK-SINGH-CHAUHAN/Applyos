"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSectionLinesByKeywords = void 0;
/**
 * Return section lines that contain any of the keywords.
 */
const getSectionLinesByKeywords = (sections, keywords) => {
    for (const sectionName in sections) {
        const hasKeyWord = keywords.some((keyword) => sectionName.toLowerCase().includes(keyword));
        if (hasKeyWord) {
            return sections[sectionName];
        }
    }
    return [];
};
exports.getSectionLinesByKeywords = getSectionLinesByKeywords;
