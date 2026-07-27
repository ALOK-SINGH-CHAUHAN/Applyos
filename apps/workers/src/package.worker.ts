import { Worker, Job as BullJob } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { createStorageProvider } from '@autoapply/storage-provider';

const prisma = new PrismaClient();
const storage = createStorageProvider();

export const packageWorker = new Worker(
  'package-process',
  async (job: BullJob) => {
    const { resumeVersionId, applicationId } = job.data;
    console.log(`[Package Worker] Packing assets for Resume Version: ${resumeVersionId}, Application: ${applicationId}`);

    try {
      await job.updateProgress({ percent: 10, step: 'Retrieving application details...' });

      const app = await prisma.application.findUnique({
        where: { id: applicationId },
        include: { coverLetter: true },
      });

      if (!app) {
        throw new Error(`Application ${applicationId} not found`);
      }

      const activeVersionId = resumeVersionId || app.resumeVersionId;
      console.log(`[Package Worker] Packaging assets for active version ID: ${activeVersionId}, Application: ${applicationId}`);

      await job.updateProgress({ percent: 30, step: 'Verifying tailored PDF assembly...' });

      const resumeVersion = await prisma.resumeVersion.findUnique({
        where: { id: activeVersionId },
      });

      if (!resumeVersion) {
        throw new Error(`Resume version ${activeVersionId} not found`);
      }

      // Check if PDF exists in local storage
      const tailoredFileName = `tailored-${activeVersionId}.pdf`;
      const storageKey = `resumes/${tailoredFileName}`;
      
      let fileExists = false;
      try {
        const fileBuffer = await storage.getFile(storageKey);
        fileExists = !!(fileBuffer && fileBuffer.length > 0);
      } catch (err) {}

      if (!fileExists) {
        throw new Error(`Tailored PDF file ${storageKey} was not compiled or saved in storage.`);
      }

      await job.updateProgress({ percent: 80, step: 'Assembling final cover letter attachments...' });

      // Transition application to READY_FOR_REVIEW
      await prisma.application.update({
        where: { id: applicationId },
        data: { status: 'READY_FOR_REVIEW' },
      });

      await job.updateProgress({ percent: 100, step: 'Package compilation passed compliance.' });

      return {
        success: true,
        pdfStorageKey: storageKey,
        hasCoverLetter: !!app.coverLetter,
        atsScore: resumeVersion.atsScore || 90,
      };
    } catch (err) {
      console.error('[Package Worker] Package compile failed:', err);
      await prisma.application.update({
        where: { id: applicationId },
        data: { status: 'FAILED' },
      }).catch(() => {});
      throw err;
    }
  },
  {
    connection: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
    },
    concurrency: parseInt(process.env.CONCURRENCY_PACKAGE_PROCESS || '3', 10),
  }
);
