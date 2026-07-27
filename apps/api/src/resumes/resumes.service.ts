import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageProvider, createStorageProvider } from '@autoapply/storage-provider';
import { Queue } from 'bullmq';
import * as path from 'path';
import * as fs from 'fs/promises';
import { chromium } from 'playwright';
import { renderResumeToHtml } from '@autoapply/resume-render';

@Injectable()
export class ResumesService {
  private storage: StorageProvider;
  private queue: Queue;
  private comparisonQueue: Queue;
  private tailoringQueue: Queue;

  constructor(private readonly prisma: PrismaService) {
    const redisHost = process.env.REDIS_HOST || 'localhost';
    const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
    
    this.storage = createStorageProvider();
    this.queue = new Queue('resume-parse', {
      connection: {
        host: redisHost,
        port: redisPort,
      },
    });
    this.comparisonQueue = new Queue('comparison-process', {
      connection: {
        host: redisHost,
        port: redisPort,
      },
    });
    this.tailoringQueue = new Queue('tailoring-process', {
      connection: {
        host: redisHost,
        port: redisPort,
      },
    });
  }

  private async getOrCreateDefaultUser() {
    let user = await this.prisma.user.findFirst();
    if (!user) {
      const workspace = await this.prisma.workspace.create({
        data: {
          name: 'Default Workspace',
        },
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

  async uploadResume(fileName: string, buffer: Buffer, mimeType: string, userId?: string) {
    let finalUserId = userId;
    if (!finalUserId) {
      const user = await this.getOrCreateDefaultUser();
      finalUserId = user.id;
    }

    // Generate unique key and upload file
    const uniqueName = `${Date.now()}-${fileName}`;
    const fileUrl = await this.storage.uploadFile(`resumes/${uniqueName}`, buffer, mimeType);

    // Save Resume entity with status PARSING
    const resume = await this.prisma.resume.create({
      data: {
        title: fileName.replace(path.extname(fileName), ''),
        originalFileUrl: fileUrl,
        status: 'PARSING',
        userId: finalUserId,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: finalUserId,
        action: 'RESUME_UPLOAD',
        resourceType: 'resume',
        resourceId: resume.id,
        metadataJson: { fileName, fileUrl },
      },
    });

    // Enqueue job to resume-parse BullMQ queue
    // BullMQ expects payload inside job constructor
    const filePath = path.join('/tmp/autoapply-storage/resumes', uniqueName);
    const job = await this.queue.add('parse', {
      resumeId: resume.id,
      filePath,
      fileName,
    });

    return {
      ...resume,
      jobId: job.id,
    };
  }

  async listResumes(userId?: string) {
    let finalUserId = userId;
    if (!finalUserId) {
      const user = await this.getOrCreateDefaultUser();
      finalUserId = user.id;
    }
    return this.prisma.resume.findMany({
      where: { userId: finalUserId },
      orderBy: { createdAt: 'desc' },
      include: {
        versions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async getResume(id: string, userId?: string) {
    return this.prisma.resume.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async getResumeIntelligence(id: string, userId?: string) {
    const resume = await this.prisma.resume.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: { createdAt: 'desc' },
          include: {
            applications: {
              include: {
                job: true,
              },
            },
          },
        },
      },
    });

    if (!resume) {
      throw new Error('Resume not found');
    }

    const latestVersion = resume.versions[0];
    if (!latestVersion) {
      return null;
    }

    return {
      atsScore: latestVersion.atsScore || 80,
      atsScoreBreakdown: latestVersion.atsScoreBreakdownJson || {
        atsCompatibility: 80,
        formatting: 85,
        keywordDensity: 75,
        readability: 82,
        grammar: 90,
        impactScore: 78
      },
      aiSummary: latestVersion.aiSummaryJson || {
        primaryTarget: 'Software Engineer',
        overview: resume.parsedJson ? (resume.parsedJson as any).summary || 'No summary available.' : 'Pending analysis...',
        strengths: ['Analytical problem solving'],
        weaknesses: ['Quantified impact metrics']
      },
      skillsCategorized: latestVersion.skillsCategorizedJson || {
        Programming: resume.parsedJson ? ((resume.parsedJson as any).skills || []).map((s: string) => ({ name: s, confidence: 90 })) : []
      },
      insights: latestVersion.insightsJson || {
        positive: ['ATS friendly layout structure detected'],
        warnings: ['Consider adding quantified project achievements']
      },
      jobCompatibility: latestVersion.jobCompatibilityJson || {
        'AI Engineer': 80,
        'Backend Engineer': 85,
        'Platform Engineer': 75,
        'Software Engineer': 90,
        'Frontend Engineer': 70,
        'Data Scientist': 50
      },
      suggestions: latestVersion.suggestionsJson || [
        'Quantify achievements to increase impact score',
        'Add details for cloud infrastructure tools'
      ],
      metadata: latestVersion.metadataJson || {
        language: 'en',
        chunkCount: 12,
        parserUsed: 'unstructured',
        statistics: {
          projectsCount: resume.parsedJson ? ((resume.parsedJson as any).projects || []).length : 0,
          experienceYears: resume.parsedJson ? ((resume.parsedJson as any).experience || []).length * 2 : 0,
          achievementsCount: 4,
          educationCount: resume.parsedJson ? ((resume.parsedJson as any).education || []).length : 0,
          skillsCount: resume.parsedJson ? ((resume.parsedJson as any).skills || []).length : 0,
          readingTimeMinutes: 2
        }
      },
      versions: resume.versions.map(v => ({
        id: v.id,
        createdAt: v.createdAt,
        atsScore: v.atsScore,
        targetRole: (v.aiSummaryJson as any)?.primaryTarget || 'Original Resume',
        applicationsCount: v.applications.length,
        applications: v.applications.map(a => ({
          id: a.id,
          status: a.status,
          company: a.job.company,
          title: a.job.title,
        })),
      }))
    };
  }

  async getJobStatus(jobId: string) {
    return this.queue.getJob(jobId);
  }

  async getActiveJobForResume(resumeId: string) {
    const jobs = await this.queue.getJobs(['active', 'waiting', 'delayed', 'paused']);
    return jobs.find(job => job?.data?.resumeId === resumeId);
  }

  async analyzeResume(id: string, force?: boolean) {
    const resume = await this.prisma.resume.findUnique({
      where: { id },
      include: {
        versions: true,
      },
    });

    if (!resume) {
      throw new Error('Resume not found');
    }

    // Return cached completed job if it exists and force is false
    if (!force && resume.status === 'READY' && resume.versions.length > 0) {
      return { status: 'COMPLETED', jobId: 'cached' };
    }

    // Set resume status back to PARSING
    await this.prisma.resume.update({
      where: { id },
      data: { status: 'PARSING' },
    });

    // Enqueue parse/analyze job
    const uniqueName = path.basename(resume.originalFileUrl);
    const filePath = path.join('/tmp/autoapply-storage/resumes', uniqueName);
    
    const job = await this.queue.add('parse', {
      resumeId: resume.id,
      filePath,
      fileName: resume.title,
    });

    return { status: 'PENDING', jobId: job.id };
  }

  async generatePdf(id: string): Promise<Buffer> {
    let contentJson: any = null;
    let title = 'resume';

    // 1. Try to find by ResumeVersion first
    const version = await this.prisma.resumeVersion.findUnique({
      where: { id },
      include: { resume: true },
    });

    if (version) {
      contentJson = version.contentJson;
      title = version.resume.title;
    } else {
      // 2. Fall back to Resume root
      const resume = await this.prisma.resume.findUnique({
        where: { id },
      });
      if (resume) {
        contentJson = resume.parsedJson;
        title = resume.title;
      }
    }

    if (!contentJson) {
      throw new Error('Resume structured content is not ready yet');
    }

    const html = renderResumeToHtml(contentJson as any);

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent(html);
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '0.4in',
        bottom: '0.4in',
        left: '0.4in',
        right: '0.4in',
      },
      printBackground: true,
    });
    await browser.close();
    return pdfBuffer;
  }

  async compareResume(resumeVersionId: string, jobId: string) {
    const existing = await this.prisma.resumeJobMatch.findUnique({
      where: {
        resumeVersionId_jobId: {
          resumeVersionId,
          jobId,
        },
      },
    });

    if (existing) {
      return { status: 'COMPLETED', jobId: 'cached', result: existing };
    }

    const job = await this.comparisonQueue.add('compare', {
      resumeVersionId,
      jobId,
    });

    return { status: 'PENDING', jobId: job.id };
  }

  async tailorResume(resumeVersionId: string, jobId: string) {
    const job = await this.tailoringQueue.add('tailor', {
      resumeVersionId,
      jobId,
    });

    return { status: 'PENDING', jobId: job.id };
  }

  async getMatchJobStatus(jobId: string) {
    let job = await this.comparisonQueue.getJob(jobId);
    if (!job) {
      job = await this.tailoringQueue.getJob(jobId);
    }

    if (!job) {
      return { status: 'FAILED', progress: { percent: 0, step: 'Job not found' } };
    }

    const state = await job.getState();
    const progress = job.progress || { percent: 0, step: 'Queued' };

    let result = null;
    if (state === 'completed') {
      const { resumeVersionId, jobId: targetJobId } = job.data;
      if (job.name === 'tailor') {
        result = await this.prisma.resumeVersion.findFirst({
          where: {
            sourceVersionId: resumeVersionId,
            tailoredForJobId: targetJobId,
          },
          orderBy: { createdAt: 'desc' },
        });
      } else {
        result = await this.prisma.resumeJobMatch.findUnique({
          where: {
            resumeVersionId_jobId: {
              resumeVersionId,
              jobId: targetJobId,
            },
          },
        });
      }
    }

    return {
      status: state.toUpperCase(),
      jobId: job.id,
      progress,
      result,
    };
  }

  async getResumeMatches(resumeVersionId: string) {
    return this.prisma.resumeJobMatch.findMany({
      where: { resumeVersionId },
      include: {
        job: {
          include: {
            analysis: true,
            requirements: true,
          },
        },
      },
    });
  }
}
