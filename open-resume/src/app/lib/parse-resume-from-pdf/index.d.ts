/**
 * Resume parser util that parses a resume from a resume pdf file
 *
 * Note: The parser algorithm only works for single column resume in English language
 */
export declare const parseResumeFromPdf: (fileUrl: string) => Promise<any>;
