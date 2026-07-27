import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Queue } from 'bullmq';

@Injectable()
export class OrchestrationService {
  private shirQueue: Queue;
  private submitQueue: Queue;

  constructor(private readonly prisma: PrismaService) {
    const redisHost = process.env.REDIS_HOST || 'localhost';
    const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
    const connection = { host: redisHost, port: redisPort };

    // Route directly to the workers that actually exist and process these queues.
    // 'shir-orchestrator' → shirOrchestratorWorker in shir.worker.ts
    // 'application-submit' → applicationSubmitWorker in submissions.worker.ts
    this.shirQueue = new Queue('shir-orchestrator', { connection });
    this.submitQueue = new Queue('application-submit', { connection });
  }

  /**
   * Start the full preparation pipeline for an application:
   * CREATED → TAILORING → (Resume Parse → Job Analyze → Compare → Tailor → Cover Letter → Package) → READY_FOR_REVIEW
   *
   * Routes to shirOrchestratorWorker which handles the entire pipeline.
   */
  async startPrepareFlow(applicationId: string) {
    const app = await this.prisma.application.findUnique({
      where: { id: applicationId },
    });
    if (!app) throw new Error('Application not found');

    // Transition to TAILORING before enqueuing so the frontend can see progress immediately
    await this.prisma.application.update({
      where: { id: applicationId },
      data: { status: 'TAILORING' },
    });

    // Enqueue to shir-orchestrator — this worker does the complete prepare flow
    const job = await this.shirQueue.add(
      'prepare',
      { applicationId, action: 'prepare' },
      {
        attempts: 2,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: false, // Keep for progress polling
        removeOnFail: false,
      },
    );

    return { bullJobId: job.id };
  }

  /**
   * Start the submission flow after the user approves the READY_FOR_REVIEW application.
   * Routes to applicationSubmitWorker in submissions.worker.ts which runs the Playwright automation.
   */
  async startSubmitFlow(applicationId: string) {
    // Update status to AUTOMATION_PREPARING so the UI knows submission started
    await this.prisma.application.update({
      where: { id: applicationId },
      data: { status: 'AUTOMATION_PREPARING' },
    });

    // Enqueue directly to 'application-submit' where applicationSubmitWorker listens
    const job = await this.submitQueue.add(
      'submit',
      { applicationId },
      {
        attempts: 2,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: false,
        removeOnFail: false,
      },
    );

    return { bullJobId: job.id };
  }

  async getPrepareJob(applicationId: string) {
    const jobs = await this.shirQueue.getJobs(['active', 'waiting', 'delayed', 'paused']);
    return jobs.find(j => j.data.applicationId === applicationId);
  }

  async getSubmitJob(applicationId: string) {
    const jobs = await this.submitQueue.getJobs(['active', 'waiting', 'delayed', 'paused']);
    return jobs.find(j => j.data.applicationId === applicationId);
  }
}
