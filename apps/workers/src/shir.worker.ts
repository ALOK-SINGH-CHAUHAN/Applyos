import { Worker, Queue, Job as BullJob } from 'bullmq';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
};

// Sub-queues for orchestrating lifecycle
const resumeQueue = new Queue('resume-parse', { connection });
const jobQueue = new Queue('job-process', { connection });
const comparisonQueue = new Queue('comparison-process', { connection });
const tailoringQueue = new Queue('tailoring-process', { connection });
const coverLetterQueue = new Queue('cover-letter-process', { connection });
const packageQueue = new Queue('package-process', { connection });
const submitQueue = new Queue('application-submit', { connection });

// Helper to wait for any BullMQ job to complete and report sub-progress
async function waitForSubJob(
  job: BullJob, 
  parentJob: BullJob, 
  basePercent: number, 
  allocatedPercent: number,
  stepName: string,
  queue: Queue
): Promise<any> {
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      try {
        const state = await job.getState();
        const progress = job.progress as any;
        
        let subPercent = 0;
        let subStep = '';
        let provider = '';
        let cached = false;
        
        if (progress) {
          subPercent = typeof progress.percent === 'number' ? progress.percent : 0;
          subStep = progress.step || '';
          provider = progress.provider || '';
          cached = !!progress.cached;
        }

        const overallPercent = Math.min(
          99,
          basePercent + Math.round((subPercent / 100) * allocatedPercent)
        );

        await parentJob.updateProgress({
          percent: overallPercent,
          step: `${stepName}: ${subStep || 'Running...'}`,
          provider: provider || undefined,
          cached,
          estTimeRemaining: `${Math.max(1, Math.round((100 - overallPercent) * 0.1))}s`
        });

        if (state === 'completed') {
          clearInterval(interval);
          const freshJob = await queue.getJob(job.id!);
          resolve(freshJob?.returnvalue);
        } else if (state === 'failed') {
          clearInterval(interval);
          const freshJob = await queue.getJob(job.id!);
          reject(new Error(freshJob?.failedReason || 'Sub-job execution failed'));
        }
      } catch (e) {
        clearInterval(interval);
        reject(e);
      }
    }, 1000);
  });
}

export const shirOrchestratorWorker = new Worker(
  'shir-orchestrator',
  async (bullJob: BullJob) => {
    const { applicationId, action } = bullJob.data;
    console.log(`[SHIR] Starting Orchestration for Application ID: ${applicationId}, Action: ${action || 'prepare'}`);

    try {
      // 1. Fetch Application context
      const app = await prisma.application.findUnique({
        where: { id: applicationId },
        include: {
          job: true,
          resumeVersion: {
            include: {
              resume: true,
            }
          }
        }
      });

      if (!app) {
        throw new Error(`Application ${applicationId} not found`);
      }

      // If action is "submit", bypass matching and trigger the submission queue
      if (action === 'submit') {
        console.log(`[SHIR] Submitting Application: ${applicationId}`);
        
        await bullJob.updateProgress({
          percent: 80,
          step: 'Submitting application package to submission queue...',
          estTimeRemaining: '5s'
        });

        const subJob = await submitQueue.add('submit', { applicationId });
        await waitForSubJob(subJob, bullJob, 80, 20, 'Automated Submitter', submitQueue);

        await prisma.application.update({
          where: { id: applicationId },
          data: { status: 'SUBMITTED', submittedAt: new Date() }
        });
        
        console.log(`[SHIR] Application ${applicationId} successfully submitted!`);
        return { success: true, status: 'SUBMITTED' };
      }

      // ----------------------------------------------------
      // Preparation flow (QUEUED -> GENERATING -> READY_FOR_REVIEW)
      // ----------------------------------------------------
      
      // Update status to TAILORING
      await prisma.application.update({
        where: { id: applicationId },
        data: { status: 'TAILORING' }
      });

      // Step A: Parse Resume if not fully ready
      let resumeVersionId = app.resumeVersionId;
      if (app.resumeVersion.resume.status !== 'READY') {
        console.log(`[SHIR] Resume not ready. Enqueueing parser job...`);
        const subJob = await resumeQueue.add('parse', { resumeId: app.resumeVersion.resumeId });
        await waitForSubJob(subJob, bullJob, 0, 20, 'Parsing Resume', resumeQueue);
        
        const freshResume = await prisma.resume.findUnique({
          where: { id: app.resumeVersion.resumeId },
          include: { versions: { orderBy: { createdAt: 'desc' } } }
        });
        resumeVersionId = freshResume?.versions[0]?.id || resumeVersionId;
      } else {
        await bullJob.updateProgress({ percent: 20, step: 'Resume parsing: complete!', estTimeRemaining: '8s' });
      }

      // Step B: Parse Job if not ready
      if (app.job.status !== 'READY' && app.job.status !== 'COMPLETED') {
        console.log(`[SHIR] Job description analysis not complete. Enqueueing job analyzer...`);
        const subJob = await jobQueue.add('ai-extract', { jobId: app.jobId, descriptionRaw: app.job.descriptionRaw, title: app.job.title, company: app.job.company });
        await waitForSubJob(subJob, bullJob, 20, 20, 'Parsing Job', jobQueue);
      } else {
        await bullJob.updateProgress({ percent: 40, step: 'Job Ingestion: complete!', estTimeRemaining: '6s' });
      }

      // Step C: Resume ↔ Job Comparison
      console.log(`[SHIR] Enqueueing comparison task...`);
      const compSubJob = await comparisonQueue.add('compare', {
        resumeVersionId,
        jobId: app.jobId
      });
      await waitForSubJob(compSubJob, bullJob, 40, 15, 'Comparison Engine', comparisonQueue);

      // Step D: AI Tailoring
      console.log(`[SHIR] Enqueueing resume tailoring...`);
      const tailorSubJob = await tailoringQueue.add('tailor', {
        resumeVersionId,
        jobId: app.jobId
      });
      const tailoringResult = await waitForSubJob(tailorSubJob, bullJob, 55, 20, 'Tailoring Engine', tailoringQueue);
      const tailoredVersionId = tailoringResult.id;

      // Step E: Cover Letter Generation
      console.log(`[SHIR] Enqueueing cover letter generator...`);
      const coverLetterSubJob = await coverLetterQueue.add('generate', {
        resumeVersionId: tailoredVersionId,
        jobId: app.jobId,
        applicationId
      });
      const coverLetterResult = await waitForSubJob(coverLetterSubJob, bullJob, 75, 15, 'Cover Letter', coverLetterQueue);

      // Step F: Assembly & Packaging
      console.log(`[SHIR] Enqueueing packaging and auditing...`);
      const packageSubJob = await packageQueue.add('package', {
        resumeVersionId: tailoredVersionId,
        applicationId
      });
      await waitForSubJob(packageSubJob, bullJob, 90, 10, 'Packaging Assistant', packageQueue);

      // Update Application association with the new tailored child version and cover letter
      await prisma.application.update({
        where: { id: applicationId },
        data: {
          resumeVersionId: tailoredVersionId,
          coverLetterId: coverLetterResult.id,
          status: 'READY_FOR_REVIEW'
        }
      });

      await bullJob.updateProgress({
        percent: 100,
        step: 'Application package prepared successfully and is ready for review!',
        estTimeRemaining: '0s'
      });

      console.log(`[SHIR] Preparation complete for Application ID: ${applicationId}`);
      return { success: true, status: 'READY_FOR_REVIEW', resumeVersionId: tailoredVersionId };

    } catch (err: any) {
      console.error(`[SHIR] Orchestration failed for Application ID: ${applicationId}`, err);
      
      await prisma.application.update({
        where: { id: applicationId },
        data: { status: 'NEEDS_MANUAL_ACTION' }
      }).catch(() => {});

      throw err;
    }
  },
  {
    connection,
    concurrency: parseInt(process.env.CONCURRENCY_SHIR || '3', 10),
  }
);
