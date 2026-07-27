import type { TextItems, Lines } from "lib/parse-resume-from-pdf/types";
/**
 * Step 2: Group text items into lines. This returns an array where each position
 * contains text items in the same line of the pdf file.
 */
export declare const groupTextItemsIntoLines: (textItems: TextItems) => Lines;
