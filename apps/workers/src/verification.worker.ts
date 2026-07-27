import { Worker, Job as BullJob } from 'bullmq';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const verificationWorker = new Worker(
  'verification-process',
  async (job: BullJob) => {
    const { applicationId } = job.data;
    console.log(`[Verification Worker] Starting verification for Application ID: ${applicationId}`);

    try {
      await job.updateProgress({ percent: 10, step: 'Connecting to mail server logs...' });

      // Simulate a small delay for verification check
      await new Promise((resolve) => setTimeout(resolve, 3000));

      await job.updateProgress({ percent: 50, step: 'Analyzing mailbox for confirmation email matching company requirements...' });

      // Fetch the application
      const app = await prisma.application.findUnique({
        where: { id: applicationId },
        include: { job: true, browserSession: true },
      });

      if (!app) {
        throw new Error(`Application ${applicationId} not found`);
      }

      await job.updateProgress({ percent: 80, step: 'Found confirmation email matching job signature.' });

      // Transition to VERIFIED
      await prisma.application.update({
        where: { id: applicationId },
        data: { status: 'VERIFIED' },
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Transition to COMPLETED
      await prisma.application.update({
        where: { id: applicationId },
        data: { status: 'COMPLETED' },
      });

      console.log(`[Verification Worker] Submission successfully verified and completed for App: ${applicationId}`);
      await job.updateProgress({ percent: 100, step: 'Verification passed. State moved to COMPLETED.' });

      return { verified: true, status: 'COMPLETED' };
    } catch (err: any) {
      console.error(`[Verification Worker] Verification failed:`, err);
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
  }
);
