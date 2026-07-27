import { Worker, Job as BullJob } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { createStorageProvider } from '@autoapply/storage-provider';
import { AutomationEngine } from '@autoapply/automation';
import { GeminiProvider, GroqProvider, OpenRouterProvider, CerebrasProvider, MistralProvider, NvidiaProvider, ProviderChain } from '@autoapply/ai-provider';
import { pluginRegistry } from './plugins';
import * as path from 'path';
import * as fs from 'fs/promises';

const prisma = new PrismaClient();
const storage = createStorageProvider();
const aiProvider = new ProviderChain([
  new GeminiProvider(),
  new GroqProvider(),
  new CerebrasProvider(),
  new NvidiaProvider(),
  new MistralProvider(),
  new OpenRouterProvider(),
]);

export const applicationSubmitWorker = new Worker(
  'application-submit',
  async (bullJob: BullJob) => {
    const { applicationId } = bullJob.data;
    console.log(`[Submit Worker] Executing submission automation for Application ID: ${applicationId}`);

    // Create session logs and screenshots accumulator
    const logs: string[] = [];
    const screenshots: string[] = [];

    const addLog = (msg: string) => {
      const formatted = `[${new Date().toISOString()}] ${msg}`;
      console.log(formatted);
      logs.push(formatted);
    };

    // 1. Fetch Application relations
    const app = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: true,
        resumeVersion: {
          include: {
            resume: true,
          },
        },
        coverLetter: true,
      },
    });

    if (!app) {
      throw new Error(`Application ${applicationId} not found`);
    }

    // Create or update BrowserSession
    let session = await prisma.browserSession.findUnique({
      where: { applicationId },
    });

    if (!session) {
      session = await prisma.browserSession.create({
        data: {
          applicationId,
          pluginName: app.job.sourcePlatform,
          status: 'RUNNING',
          logJson: [],
          screenshotsJson: [],
        },
      });
    } else {
      await prisma.browserSession.update({
        where: { id: session.id },
        data: {
          status: 'RUNNING',
          startedAt: new Date(),
          finishedAt: null,
          lastError: null,
        },
      });
    }

    // Transition application to AUTOMATION_RUNNING
    await prisma.application.update({
      where: { id: applicationId },
      data: { status: 'AUTOMATION_RUNNING' },
    });

    const tempResumePath = path.join('/tmp', `tailored-resume-${applicationId}.txt`);
    const resumeContent = JSON.stringify(app.resumeVersion.contentJson, null, 2);
    await fs.writeFile(tempResumePath, resumeContent, 'utf-8');

    try {
      addLog(`Invoking modular AutomationEngine for Application ID: ${applicationId}`);
      const engine = new AutomationEngine();
      const result = await engine.run({
        applicationId,
        url: app.job.sourceUrl,
        resumeFilePath: tempResumePath,
        coverLetterText: app.coverLetter?.content || undefined,
        userData: {
          fullName: (app.resumeVersion.contentJson as any).contact?.fullName || 'Alok Chauhan',
          email: (app.resumeVersion.contentJson as any).contact?.email || 'seeker@autoapply.dev',
          phone: (app.resumeVersion.contentJson as any).contact?.phone || '+1 555-0199',
          location: (app.resumeVersion.contentJson as any).contact?.location || 'San Francisco, CA',
        },
        storageProvider: storage,
        pluginRegistry,
        aiProvider,
      });

      if (!result.success) {
        throw new Error(result.error || 'Submission call returned unsuccessful status');
      }

      // Success clean up
      await fs.unlink(tempResumePath).catch(() => {});

      // Update BrowserSession with final status, logs, screenshots
      await prisma.browserSession.update({
        where: { id: session.id },
        data: {
          status: 'SUCCESS',
          finishedAt: new Date(),
          logJson: result.logs || [],
          screenshotsJson: result.screenshots || [],
        },
      });

      // 3. Update Application Status
      await prisma.application.update({
        where: { id: applicationId },
        data: {
          status: 'SUBMITTED',
          submittedAt: new Date(),
        },
      });

      addLog(`Automated submission completed successfully for Application ID: ${applicationId}`);
    } catch (err: any) {
      console.error(`[Submit Worker] Automation failed for Application ID: ${applicationId}`, err);
      // Clean up file if failed
      await fs.unlink(tempResumePath).catch(() => {});

      // Update BrowserSession on Failure
      if (session) {
        // Attempt to extract logs/screenshots from the thrown error context if it was an engine execution
        const engineLogs = err.logs || logs;
        const engineScreenshots = err.screenshots || screenshots;
        
        await prisma.browserSession.update({
          where: { id: session.id },
          data: {
            status: 'FAILED',
            finishedAt: new Date(),
            lastError: err.message || String(err),
            logJson: engineLogs,
            screenshotsJson: engineScreenshots,
          },
        }).catch((dbErr) => console.error('Failed to update failed browser session:', dbErr));
      }

      // Update Application Status
      await prisma.application.update({
        where: { id: applicationId },
        data: {
          status: 'NEEDS_MANUAL_ACTION',
        },
      });

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
