import { z } from 'zod';

export const ImportJobSchema = z.object({
  url: z.string().url(),
});

export const BulkImportJobSchema = z.object({
  urls: z.array(z.string().url()).min(1),
});

export const ApplicationSubmitSchema = z.object({
  jobId: z.string().uuid(),
  resumeVersionId: z.string().uuid(),
});
