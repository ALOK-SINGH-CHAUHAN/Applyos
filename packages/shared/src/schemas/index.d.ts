import { z } from 'zod';
export declare const ImportJobSchema: z.ZodObject<{
    url: z.ZodString;
}, "strip", z.ZodTypeAny, {
    url: string;
}, {
    url: string;
}>;
export declare const BulkImportJobSchema: z.ZodObject<{
    urls: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    urls: string[];
}, {
    urls: string[];
}>;
export declare const ApplicationSubmitSchema: z.ZodObject<{
    jobId: z.ZodString;
    resumeVersionId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    jobId: string;
    resumeVersionId: string;
}, {
    jobId: string;
    resumeVersionId: string;
}>;
