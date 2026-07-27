import { chromium } from 'playwright';
import { SiteDetector } from './site-detector';
import { PluginRegistry } from './plugin-registry';
import { SubmissionResult } from './job-platform-plugin.interface';
import * as path from 'path';

export interface AutomationEngineOptions {
  applicationId: string;
  url: string;
  resumeFilePath: string;
  coverLetterText?: string;
  userData: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    organization?: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
    [key: string]: any;
  };
  storageProvider?: {
    uploadFile(filePath: string, buffer: Buffer, mimeType: string): Promise<string>;
  };
  pluginRegistry: PluginRegistry;
  aiProvider?: any; // Configured AI Provider Chain
}

let prismaInstance: any;
function getPrisma() {
  if (!prismaInstance) {
    try {
      const { PrismaClient } = require('@prisma/client');
      prismaInstance = new PrismaClient();
    } catch (e) {
      console.warn('[Automation Engine] Failed to load PrismaClient, telemetry persistence disabled.');
    }
  }
  return prismaInstance;
}

export class AutomationEngine {
  async run(options: AutomationEngineOptions): Promise<SubmissionResult> {
    const startTime = Date.now();
    const steps: Array<{ step: string; timestamp: string }> = [];
    const screenshots: string[] = [];
    let success = false;
    let errorText: string | null = null;
    let detectedAts = 'unknown';
    let pluginUsed = 'unknown';

    const addLog = (msg: string) => {
      const timestamp = new Date().toISOString();
      console.log(`[Automation Engine] [${timestamp}] ${msg}`);
      steps.push({ step: msg, timestamp });
    };

    addLog('Launching Chromium browser context...');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    const captureScreenshot = async (name: string) => {
      if (!options.storageProvider) return;
      try {
        const buffer = await page.screenshot();
        const uploadPath = `screenshots/${options.applicationId}-${name}-${Date.now()}.png`;
        const url = await options.storageProvider.uploadFile(uploadPath, buffer, 'image/png');
        screenshots.push(url);
        addLog(`Captured screenshot [${name}]: ${url}`);
      } catch (err: any) {
        addLog(`Failed to capture screenshot [${name}]: ${err.message || err}`);
      }
    };

    try {
      addLog(`Navigating browser to: ${options.url}`);
      await page.goto(options.url, { waitUntil: 'domcontentloaded' });
      await captureScreenshot('landing');

      addLog('Scanning page for ATS markers...');
      detectedAts = await SiteDetector.detect(page, options.url);

      // Match plugin
      let plugin = (options.pluginRegistry as any).findForDomain(options.url);
      if (!plugin && detectedAts !== 'unknown') {
        plugin = (options.pluginRegistry as any).get(detectedAts) || (options.pluginRegistry as any).findForDomain(detectedAts);
      }

      if (!plugin) {
        throw new Error(`No compatible browser automation plugin found for ATS platform: ${detectedAts}`);
      }

      pluginUsed = plugin.name;
      addLog(`Selected automation plugin: "${pluginUsed}" (detected ATS: "${detectedAts}")`);

      addLog(`Uploading tailored resume file: ${path.basename(options.resumeFilePath)}`);
      await plugin.uploadResume(page, options.resumeFilePath);

      addLog('Filling user profile fields and screening answers...');
      const appCtx = {
        resumeFilePath: options.resumeFilePath,
        userData: {
          ...options.userData,
          coverLetter: options.coverLetterText,
        },
        aiProvider: options.aiProvider,
      };
      await plugin.answerQuestions(page, appCtx);
      await captureScreenshot('filled');

      addLog('Triggering final form submission...');
      const result = await plugin.submit(page);

      if (!result.success) {
        throw new Error(result.error || 'Submit action failed.');
      }

      await captureScreenshot('success');
      addLog(`Form submitted successfully. Logs: ${JSON.stringify(result.logs)}`);
      success = true;

      return {
        success: true,
        screenshots,
        logs: steps.map((s) => s.step),
      };
    } catch (err: any) {
      errorText = err.message || String(err);
      addLog(`CRITICAL AUTOMATION EXCEPTION: ${errorText}`);
      await captureScreenshot('error');
      
      return {
        success: false,
        error: errorText ?? undefined,
        screenshots,
        logs: steps.map((s) => s.step),
      };
    } finally {
      await page.close();
      await context.close();
      await browser.close();

      const durationMs = Date.now() - startTime;
      addLog(`Automation run finished in ${durationMs}ms with success=${success}`);

      // Persist to database
      const prisma = getPrisma();
      if (prisma) {
        try {
          addLog('Writing logs to AutomationExecution database table...');
          await prisma.automationExecution.create({
            data: {
              applicationId: options.applicationId,
              plugin: pluginUsed,
              ats: detectedAts,
              durationMs,
              stepsJson: steps as any,
              screenshotsJson: screenshots as any,
              success,
              errorText,
            },
          });
        } catch (dbErr: any) {
          console.error('[Automation Engine] Failed to save database log:', dbErr.message || dbErr);
        }
      }
    }
  }
}
