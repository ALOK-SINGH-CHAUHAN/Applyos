"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseResumeFromPdf = void 0;
const read_pdf_1 = require("lib/parse-resume-from-pdf/read-pdf");
const group_text_items_into_lines_1 = require("lib/parse-resume-from-pdf/group-text-items-into-lines");
const group_lines_into_sections_1 = require("lib/parse-resume-from-pdf/group-lines-into-sections");
const extract_resume_from_sections_1 = require("lib/parse-resume-from-pdf/extract-resume-from-sections");
/**
 * Resume parser util that parses a resume from a resume pdf file
 *
 * Note: The parser algorithm only works for single column resume in English language
 */
const parseResumeFromPdf = async (fileUrl) => {
    // Step 1. Read a pdf resume file into text items to prepare for processing
    const textItems = await (0, read_pdf_1.readPdf)(fileUrl);
    // Step 2. Group text items into lines
    const lines = (0, group_text_items_into_lines_1.groupTextItemsIntoLines)(textItems);
    // Step 3. Group lines into sections
    const sections = (0, group_lines_into_sections_1.groupLinesIntoSections)(lines);
    // Step 4. Extract resume from sections
    const resume = (0, extract_resume_from_sections_1.extractResumeFromSections)(sections);
    return resume;
};
exports.parseResumeFromPdf = parseResumeFromPdf;
