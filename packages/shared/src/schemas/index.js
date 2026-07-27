"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationSubmitSchema = exports.BulkImportJobSchema = exports.ImportJobSchema = void 0;
const zod_1 = require("zod");
exports.ImportJobSchema = zod_1.z.object({
    url: zod_1.z.string().url(),
});
exports.BulkImportJobSchema = zod_1.z.object({
    urls: zod_1.z.array(zod_1.z.string().url()).min(1),
});
exports.ApplicationSubmitSchema = zod_1.z.object({
    jobId: zod_1.z.string().uuid(),
    resumeVersionId: zod_1.z.string().uuid(),
});
