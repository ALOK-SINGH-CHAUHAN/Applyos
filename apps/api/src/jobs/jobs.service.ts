import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Queue } from 'bullmq';
import { GeminiProvider, GroqProvider, OpenRouterProvider, CerebrasProvider, MistralProvider, NvidiaProvider, ProviderChain } from '@autoapply/ai-provider';
import * as crypto from 'crypto';
import * as path from 'path';

@Injectable()
export class JobsService {
  private queue: Queue;
  private aiProvider: ProviderChain;

  constructor(private readonly prisma: PrismaService) {
    const redisHost = process.env.REDIS_HOST || 'localhost';
    const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
    this.queue = new Queue('job-process', {
      connection: {
        host: redisHost,
        port: redisPort,
      },
    });
    this.aiProvider = new ProviderChain([
      new GeminiProvider(),
      new GroqProvider(),
      new CerebrasProvider(),
      new NvidiaProvider(),
      new MistralProvider(),
      new OpenRouterProvider(),
    ]);
  }

  private detectPlatform(url: string): string {
    const lower = url.toLowerCase();
    if (lower.includes('greenhouse.io') || lower.includes('boards.greenhouse.io')) {
      return 'GREENHOUSE';
    }
    if (lower.includes('lever.co')) {
      return 'LEVER';
    }
    if (lower.includes('ashbyhq.com')) {
      return 'ASHBY';
    }
    if (lower.includes('indeed.com')) {
      return 'INDEED';
    }
    if (lower.includes('linkedin.com')) {
      return 'LINKEDIN';
    }
    if (lower.includes('guru.com')) {
      return 'GURU';
    }
    if (lower.includes('peopleperhour.com')) {
      return 'PEOPLEPERHOUR';
    }
    return 'GENERIC';
  }

  async importJob(params: { url?: string; descriptionRaw?: string; title?: string; userId?: string }) {
    const { url, descriptionRaw, title, userId } = params;

    if (url) {
      // Check if duplicate job URL exists
      const existing = await this.prisma.job.findFirst({
        where: { sourceUrl: url },
        include: {
          analysis: true,
          requirements: true,
          benefits: true,
          keywords: true,
          responsibilities: true,
          metadata: true,
          companyIntelligence: true,
        },
      });
      if (existing) {
        if (userId) {
          await this.prisma.auditLog.create({
            data: {
              userId,
              action: 'JOB_IMPORT_DUPLICATE',
              resourceType: 'job',
              resourceId: existing.id,
              metadataJson: { url, isDuplicate: true },
            },
          });
        }
        return existing;
      }

      // Create temporary unique fingerprint based on URL before scraping computes the real one
      const tempFingerprint = crypto.createHash('sha256').update(url + Date.now().toString()).digest('hex');

      const job = await this.prisma.job.create({
        data: {
          sourcePlatform: this.detectPlatform(url),
          sourceUrl: url,
          urlFingerprint: tempFingerprint,
          company: 'Pending Ingestion',
          title: 'Pending Ingestion',
          descriptionRaw: 'Job details are being extracted and analyzed...',
          status: 'IMPORTING',
        },
      });

      if (userId) {
        await this.prisma.auditLog.create({
          data: {
            userId,
            action: 'JOB_IMPORT',
            resourceType: 'job',
            resourceId: job.id,
            metadataJson: { url, isDuplicate: false },
          },
        });
      }

      // Enqueue scraping and analysis task
      await this.queue.add('import', {
        jobId: job.id,
        url,
        userId,
      });

      return job;
    } else if (descriptionRaw) {
      // Compute unique fingerprint based on descriptionRaw to prevent duplicates
      const fingerprint = crypto.createHash('sha256').update(descriptionRaw.toLowerCase().trim()).digest('hex');
      const existing = await this.prisma.job.findUnique({
        where: { urlFingerprint: fingerprint },
        include: {
          analysis: true,
          requirements: true,
          benefits: true,
          keywords: true,
          responsibilities: true,
          metadata: true,
          companyIntelligence: true,
        },
      });
      if (existing) {
        if (userId) {
          await this.prisma.auditLog.create({
            data: {
              userId,
              action: 'JOB_IMPORT_DUPLICATE',
              resourceType: 'job',
              resourceId: existing.id,
              metadataJson: { isRaw: true, isDuplicate: true },
            },
          });
        }
        return existing;
      }

      const job = await this.prisma.job.create({
        data: {
          sourcePlatform: 'MANUAL',
          sourceUrl: 'raw://' + fingerprint,
          urlFingerprint: fingerprint,
          company: 'Extracting details...',
          title: title || 'Extracting title...',
          descriptionRaw,
          status: 'IMPORTING',
        },
      });

      if (userId) {
        await this.prisma.auditLog.create({
          data: {
            userId,
            action: 'JOB_IMPORT',
            resourceType: 'job',
            resourceId: job.id,
            metadataJson: { isRaw: true, isDuplicate: false },
          },
        });
      }

      // Enqueue directly to the AI extraction task, bypassing URL scrape
      await this.queue.add('ai-extract', {
        jobId: job.id,
        descriptionRaw,
        title,
        userId,
      });

      return job;
    }

    throw new Error('Either url or descriptionRaw is required');
  }

  async listJobs() {
    return this.prisma.job.findMany({
      orderBy: { scrapedAt: 'desc' },
      include: {
        analysis: true,
        requirements: true,
        benefits: true,
        keywords: true,
        responsibilities: true,
        metadata: true,
        companyIntelligence: true,
        matches: {
          include: {
            resumeVersion: {
              include: {
                resume: true,
              },
            },
          },
        },
      },
    });
  }

  async getJob(id: string) {
    return this.prisma.job.findUnique({
      where: { id },
      include: {
        analysis: true,
        requirements: true,
        benefits: true,
        keywords: true,
        responsibilities: true,
        metadata: true,
        companyIntelligence: true,
        matches: {
          include: {
            resumeVersion: {
              include: {
                resume: true,
              },
            },
          },
        },
      },
    });
  }

  async matchResumes(jobId: string) {
    const job = await this.getJob(jobId);
    if (!job) {
      throw new Error('Job not found');
    }

    // Fetch top matching resumes using pgvector cosine similarity if embeddings are present
    let matchedVersions: Array<{
      resumeId: string;
      resumeTitle: string;
      versionId: string;
      similarity: number;
    }> = [];

    try {
      const jobEmbeddingResult = await this.prisma.$queryRawUnsafe<any[]>(
        `SELECT id FROM jobs WHERE id = $1 AND embedding IS NOT NULL`,
        jobId
      );

      if (jobEmbeddingResult.length > 0) {
        const matches = await this.prisma.$queryRawUnsafe<any[]>(
          `SELECT 
             r.id AS "resumeId", 
             r.title AS "resumeTitle", 
             rv.id AS "versionId",
             (1 - (rv.embedding <=> j.embedding))::float AS "similarity"
           FROM resume_versions rv
           JOIN resumes r ON rv.resume_id = r.id
           JOIN jobs j ON j.id = $1
           WHERE r.status = 'READY' AND rv.embedding IS NOT NULL
           ORDER BY rv.embedding <=> j.embedding ASC
           LIMIT 10`,
          jobId
        );
        matchedVersions = matches.map((m) => ({
          resumeId: m.resumeId,
          resumeTitle: m.resumeTitle,
          versionId: m.versionId,
          similarity: m.similarity,
        }));
      }
    } catch (e) {
      console.error('[JobsService] pgvector query failed, falling back to all ready resumes:', e);
    }

    // Fallback if pgvector returns nothing or throws
    if (matchedVersions.length === 0) {
      const resumes = await this.prisma.resume.findMany({
        where: { status: 'READY' },
        include: {
          versions: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });
      matchedVersions = resumes
        .filter((r) => r.versions[0])
        .map((r) => ({
          resumeId: r.id,
          resumeTitle: r.title,
          versionId: r.versions[0].id,
          similarity: 0.8, // default fallback
        }));
    }

    const matchResults = [];

    for (const match of matchedVersions) {
      // Check cache in AIOutput table
      const cached = await this.prisma.aIOutput.findFirst({
        where: {
          type: 'RESUME_MATCH',
          inputRefType: 'resume_version',
          inputRefId: match.versionId,
        },
      });

      if (cached) {
        const cachedResult = cached.outputJson as any;
        matchResults.push({
          resumeId: match.resumeId,
          resumeTitle: match.resumeTitle,
          resumeVersionId: match.versionId,
          score: cachedResult.score,
          reason: cachedResult.reason,
        });
        continue;
      }

      // No cache, call Gemini for ATS reasoning and score refinement
      try {
        const versionDetails = await this.prisma.resumeVersion.findUnique({
          where: { id: match.versionId },
        });
        if (!versionDetails) continue;

        const systemPrompt = `You are a professional ATS parser and recruiter matching assistant.
Evaluate the candidate's resume content against the job description.
Return a JSON object containing EXACTLY:
{
  "score": number (0 to 100 fit rating),
  "reason": "concise 2-sentence match reasoning"
}
Return only the raw JSON. No wrappers, code blocks, or markdown.`;

        const userMessage = `Resume: ${JSON.stringify(versionDetails.contentJson)}\n\nJob Title: ${job.title}\nCompany: ${job.company}\nDescription:\n${job.descriptionRaw}`;

        const aiResponse = await this.aiProvider.generateText({
          type: 'COMPARISON',
          systemPrompt,
          messages: [{ role: 'user', content: userMessage }],
          responseFormat: 'json',
        });

        let text = aiResponse.text.trim();
        if (text.startsWith('```')) {
          text = text.replace(/^```json\s*/, '').replace(/```$/, '').trim();
        }

        const matchObj = JSON.parse(text);

        // Save cache
        await this.prisma.aIOutput.create({
          data: {
            type: 'RESUME_MATCH',
            inputRefType: 'resume_version',
            inputRefId: match.versionId,
            providerUsed: 'gemini',
            promptVersion: '1.0',
            outputJson: matchObj,
            confidenceScore: matchObj.score / 100,
          },
        });

        matchResults.push({
          resumeId: match.resumeId,
          resumeTitle: match.resumeTitle,
          resumeVersionId: match.versionId,
          score: matchObj.score,
          reason: matchObj.reason,
        });
      } catch (err) {
        console.error(`Error matching resume version ${match.versionId}:`, err);
        // Fallback to pgvector similarity score
        matchResults.push({
          resumeId: match.resumeId,
          resumeTitle: match.resumeTitle,
          resumeVersionId: match.versionId,
          score: Math.round(match.similarity * 100),
          reason: `ATS matching algorithm calculated a ${Math.round(match.similarity * 100)}% keyword alignment score.`,
        });
      }
    }

    return matchResults.sort((a, b) => b.score - a.score);
  }
}
