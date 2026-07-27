import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrchestrationService } from './orchestration.service';

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orchestrationService: OrchestrationService,
  ) {}

  private async getOrCreateDefaultUser() {
    let user = await this.prisma.user.findFirst();
    if (!user) {
      const workspace = await this.prisma.workspace.create({
        data: { name: 'Default Workspace' },
      });
      user = await this.prisma.user.create({
        data: {
          email: 'seeker@autoapply.dev',
          name: 'Job Seeker',
          role: 'OWNER',
          workspaceId: workspace.id,
        },
      });
    }
    return user;
  }

  /**
   * Create an application and immediately kick off the SHIR preparation pipeline.
   * Flow: CREATED → auto-enqueue → TAILORING → READY_FOR_REVIEW
   */
  async createApplication(jobId: string, resumeVersionId: string, userId?: string) {
    let finalUserId = userId;
    if (!finalUserId) {
      const user = await this.getOrCreateDefaultUser();
      finalUserId = user.id;
    }

    // Validate job exists
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new BadRequestException('Job not found');

    // Validate resume version exists
    const resumeVersion = await this.prisma.resumeVersion.findUnique({
      where: { id: resumeVersionId },
    });
    if (!resumeVersion) throw new BadRequestException('Resume version not found');

    // Return existing application if already created for this user+job
    const existing = await this.prisma.application.findFirst({
      where: { userId: finalUserId, jobId },
    });
    if (existing) {
      // If it's in a terminal failed state, allow re-processing by re-enqueueing
      if (existing.status === 'NEEDS_MANUAL_ACTION' || existing.status === 'FAILED') {
        const { bullJobId } = await this.orchestrationService.startPrepareFlow(existing.id);
        return { ...existing, bullJobId };
      }
      return existing;
    }

    const application = await this.prisma.application.create({
      data: {
        userId: finalUserId,
        jobId,
        resumeVersionId,
        status: 'CREATED',
        pluginUsed: job.sourcePlatform,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: finalUserId,
        action: 'APPLICATION_CREATE',
        resourceType: 'application',
        resourceId: application.id,
        metadataJson: { jobId, resumeVersionId, status: 'CREATED' },
      },
    });

    // Immediately kick off the SHIR preparation pipeline
    const { bullJobId } = await this.orchestrationService.startPrepareFlow(application.id);

    return { ...application, bullJobId };
  }

  async listApplications(userId?: string) {
    let finalUserId = userId;
    if (!finalUserId) {
      const user = await this.getOrCreateDefaultUser();
      finalUserId = user.id;
    }
    return this.prisma.application.findMany({
      where: { userId: finalUserId },
      orderBy: { createdAt: 'desc' },
      include: {
        job: true,
        resumeVersion: {
          include: { resume: true },
        },
        coverLetter: true,
        proposal: true,
        browserSession: true,
        automationExecutions: true,
      },
    });
  }

  async getApplication(id: string) {
    return this.prisma.application.findUnique({
      where: { id },
      include: {
        job: true,
        resumeVersion: {
          include: { resume: true },
        },
        coverLetter: true,
        proposal: true,
        browserSession: true,
        automationExecutions: true,
      },
    });
  }

  async startApplication(id: string, userId?: string) {
    const app = await this.prisma.application.findUnique({ where: { id } });
    if (!app) throw new BadRequestException('Application not found');

    const { bullJobId } = await this.orchestrationService.startPrepareFlow(id);

    if (userId) {
      await this.prisma.auditLog.create({
        data: {
          userId,
          action: 'APPLICATION_START_PREPARE',
          resourceType: 'application',
          resourceId: id,
          metadataJson: { originalStatus: app.status, bullJobId },
        },
      });
    }

    return { success: true, bullJobId };
  }

  async approveApplication(id: string, userId?: string) {
    const app = await this.prisma.application.findUnique({ where: { id } });
    if (!app) throw new BadRequestException('Application not found');

    const { bullJobId } = await this.orchestrationService.startSubmitFlow(id);

    if (userId) {
      await this.prisma.auditLog.create({
        data: {
          userId,
          action: 'APPLICATION_APPROVE_SUBMIT',
          resourceType: 'application',
          resourceId: id,
          metadataJson: {
            originalStatus: app.status,
            targetStatus: 'SUBMITTING',
            bullJobId,
          },
        },
      });
    }

    return { success: true, bullJobId };
  }

  async updateCoverLetter(applicationId: string, content: string, userId?: string) {
    const coverLetter = await this.prisma.coverLetter.findUnique({
      where: { applicationId },
    });
    if (!coverLetter) throw new BadRequestException('Cover letter not found');

    const updated = await this.prisma.coverLetter.update({
      where: { id: coverLetter.id },
      data: { content },
    });

    if (userId) {
      await this.prisma.auditLog.create({
        data: {
          userId,
          action: 'APPLICATION_COVER_LETTER_UPDATE',
          resourceType: 'application',
          resourceId: applicationId,
          metadataJson: { length: content.length },
        },
      });
    }

    return updated;
  }

  async updateStatus(id: string, status: any, userId?: string) {
    const app = await this.prisma.application.findUnique({ where: { id } });
    if (!app) throw new BadRequestException('Application not found');

    const updated = await this.prisma.application.update({
      where: { id },
      data: { status },
    });

    if (userId) {
      await this.prisma.auditLog.create({
        data: {
          userId,
          action: 'APPLICATION_STATUS_UPDATE',
          resourceType: 'application',
          resourceId: id,
          metadataJson: { oldStatus: app.status, newStatus: status },
        },
      });
    }

    return updated;
  }

  /**
   * Returns the real-time application progress by reading the DB status
   * and the browser session logs (for the submission phase).
   */
  async getApplicationProgress(id: string) {
    const app = await this.prisma.application.findUnique({
      where: { id },
      include: { browserSession: true },
    });

    if (!app) return { status: 'UNKNOWN', progress: null };

    // Check active BullMQ orchestration job for fine-grained progress (0-100%)
    let bullJob: any = null;
    let bullProgress: any = null;
    try {
      // 2-second timeout to prevent Redis/BullMQ from hanging the API endpoint
      bullJob = await Promise.race([
        this.orchestrationService.getPrepareJob(id),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Redis timeout')), 2000))
      ]);
      bullProgress = bullJob?.progress as any;
    } catch (error: any) {
      console.warn(`[ApplicationsService] getPrepareJob timeout or error for app ${id}:`, error.message);
      // Fallback to DB status if Redis hangs
    }

    const STATUS_PROGRESS: Record<string, { percent: number; step: string }> = {
      CREATED:           { percent: 5,   step: 'Application created, queuing pipeline...' },
      TAILORING:         { percent: 20,  step: 'AI tailoring resume for this role...' },
      COMPARING:         { percent: 40,  step: 'Comparing resume against job requirements...' },
      COVER_LETTER:      { percent: 65,  step: 'Generating AI cover letter...' },
      PACKAGING:         { percent: 80,  step: 'Assembling final application package...' },
      READY_FOR_REVIEW:  { percent: 100, step: 'Ready! Review and approve to submit.' },
      SUBMITTING:        { percent: 50,  step: 'Browser automation running — submitting form...' },
      AUTOMATION_PREPARING:{ percent: 60, step: 'Preparing browser automation agent...' },
      AUTOMATION_RUNNING:{ percent: 75,  step: 'Automation agent filling application form...' },
      SUBMITTED:         { percent: 100, step: 'Application submitted successfully!' },
      NEEDS_MANUAL_ACTION:{ percent: 100, step: 'Action required — automation could not complete.' },
      FAILED:            { percent: 0,   step: 'Pipeline failed. Try again.' },
    };

    const fallback = STATUS_PROGRESS[app.status] || { percent: 0, step: app.status };
    const percent = typeof bullProgress?.percent === 'number' ? bullProgress.percent : fallback.percent;
    const step = bullProgress?.step || fallback.step;

    return {
      status: app.status,
      progress: {
        percent,
        step,
        logs: app.browserSession?.logJson || [],
        screenshots: app.browserSession?.screenshotsJson || [],
        finishedAt: app.browserSession?.finishedAt || null,
        lastError: app.browserSession?.lastError || null,
      },
    };
  }
}
