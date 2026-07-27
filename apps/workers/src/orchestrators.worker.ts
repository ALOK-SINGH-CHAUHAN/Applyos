import { Worker, Job as BullJob } from 'bullmq';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
};

export const prepareOrchestratorParentWorker = new Worker(
  'application-prepare-orchestrator',
  async (job: BullJob) => {
    const { applicationId } = job.data;
    console.log(`[Prepare Orchestrator] All preparation steps completed for Application ID: ${applicationId}`);

    // Ensure status is READY_FOR_REVIEW
    await prisma.application.update({
      where: { id: applicationId },
      data: { status: 'READY_FOR_REVIEW' },
    });

    return { success: true };
  },
  { connection }
);

export const submitOrchestratorParentWorker = new Worker(
  'application-submit-orchestrator',
  async (job: BullJob) => {
    const { applicationId } = job.data;
    console.log(`[Submit Orchestrator] All submission and verification steps completed for Application ID: ${applicationId}`);

    // Ensure status is COMPLETED
    await prisma.application.update({
      where: { id: applicationId },
      data: { status: 'COMPLETED' },
    });

    return { success: true };
  },
  { connection }
);
