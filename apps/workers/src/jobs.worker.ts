import { Worker, Queue, Job as BullJob } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { ProviderChain, GeminiProvider, GroqProvider, OpenRouterProvider, CerebrasProvider, MistralProvider, NvidiaProvider } from '@autoapply/ai-provider';
import { pluginRegistry } from './plugins';
import { chromium } from 'playwright';
import * as crypto from 'crypto';
import * as path from 'path';
import { JobDiscoveryService } from './discovery.service';

const prisma = new PrismaClient();
const aiProvider = new ProviderChain([
  new GeminiProvider(),
  new GroqProvider(),
  new CerebrasProvider(),
  new NvidiaProvider(),
  new MistralProvider(),
  new OpenRouterProvider(),
]);

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
const jobQueue = new Queue('job-process', {
  connection: {
    host: redisHost,
    port: redisPort,
  },
});
const comparisonQueue = new Queue('comparison-process', {
  connection: {
    host: redisHost,
    port: redisPort,
  },
});

async function scrapeJobDetails(url: string): Promise<{ title: string; company: string; descriptionRaw: string; location?: string; salaryText?: string }> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    const parsedUrl = new URL(url);
    const domain = parsedUrl.hostname;
    const plugin = pluginRegistry.findForDomain(domain);

    if (plugin) {
      console.log(`[Job Worker] Found active plugin: ${plugin.name} for domain ${domain}`);
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      const scraped = await plugin.extractJob(page, url);
      
      if (scraped.title !== 'Sample Job Title' && scraped.company !== 'Sample Company') {
        return scraped;
      }
    }

    console.log(`[Job Worker] Running fallback scraper for URL: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle' });

    let title = await page.title();
    let company = 'Unknown Company';
    let location = 'Remote';
    let salaryText = '';

    if (domain.includes('greenhouse.io')) {
      const titleEl = await page.$('.app-title');
      if (titleEl) title = (await titleEl.innerText()).trim();

      const companyEl = await page.$('.company-name');
      if (companyEl) {
        const text = await companyEl.innerText();
        company = text.replace(/at\s+/i, '').trim();
      }

      const locEl = await page.$('.location');
      if (locEl) location = (await locEl.innerText()).trim();
    } else if (domain.includes('ashbyhq.com')) {
      const titleEl = await page.$('h1');
      if (titleEl) title = (await titleEl.innerText()).trim();

      const metaCompany = await page.$('meta[property="og:site_name"]');
      if (metaCompany) company = await metaCompany.getAttribute('content') || 'Unknown Company';
    }

    let descriptionRaw = '';
    const bodyContent = await page.$('body');
    if (bodyContent) {
      descriptionRaw = await bodyContent.innerText();
    }

    return {
      title,
      company,
      descriptionRaw,
      location,
      salaryText,
    };
  } finally {
    await page.close();
    await browser.close();
  }
}

export const jobProcessWorker = new Worker(
  'job-process',
  async (bullJob: BullJob) => {
    const { name, data } = bullJob;
    console.log(`[Job Worker] Executing task: "${name}" for ${data.jobId ? 'Job ID: ' + data.jobId : 'Provider: ' + data.providerName}`);

    if (name === 'sync-provider') {
      const { providerName } = data;
      try {
        console.log(`[Job Worker] Executing background sync for provider: "${providerName}"...`);
        const discovery = new JobDiscoveryService();
        const dbConfig = await prisma.jobProviderConfiguration.findUnique({
          where: { providerName },
        });

        const ids = await discovery.discoverAndIngest('engineer', dbConfig?.credentialsJson || {});
        console.log(`[Job Worker] Ingested ${ids.length} jobs for provider ${providerName}`);

        for (const id of ids) {
          const jobRec = await prisma.job.findUnique({ where: { id } });
          if (jobRec) {
            // Jobs from structured APIs (Greenhouse/Lever/Ashby/RemoteOK) already have
            // clean structured data — skip AI extraction and mark them READY immediately.
            const apiSourcedPlatforms = ['greenhouse', 'lever', 'ashby', 'remoteok', 'company_careers'];
            if (apiSourcedPlatforms.includes(jobRec.sourcePlatform)) {
              await prisma.job.update({
                where: { id: jobRec.id },
                data: { status: 'READY' },
              });
            } else {
              // User-submitted URL — still needs AI extraction
              await jobQueue.add('ai-extract', {
                jobId: jobRec.id,
                descriptionRaw: jobRec.descriptionRaw,
                title: jobRec.title,
                company: jobRec.company,
                location: 'Remote',
                salaryText: null,
                userId: null,
              }, { priority: 100 });
            }
          }
        }
      } catch (err) {
        console.error(`[Job Worker] Background sync failed for provider ${providerName}:`, err);
        throw err;
      }
    }

    else if (name === 'import') {
      const { jobId, url, userId } = data;
      try {
        const scraped = await scrapeJobDetails(url);
        console.log(`[Job Worker] Scraped title: "${scraped.title}" from company: "${scraped.company}"`);

        // Enqueue next stage: AI Extraction
        await jobQueue.add('ai-extract', {
          jobId,
          descriptionRaw: scraped.descriptionRaw,
          title: scraped.title,
          company: scraped.company,
          location: scraped.location,
          salaryText: scraped.salaryText,
          userId,
        });
      } catch (err) {
        console.error(`[Job Worker] Import stage failed for Job ID: ${jobId}`, err);
        await prisma.job.update({
          where: { id: jobId },
          data: { status: 'FAILED' },
        }).catch((e) => console.error('Failed to mark job as FAILED', e));
        throw err;
      }
    }

    else if (name === 'ai-extract') {
      const { jobId, descriptionRaw, title, company, location, salaryText, userId } = data;
      try {
        const systemPrompt = `You are an expert recruiter and job analyst.
Analyze the job description and extract structural details.
Return a JSON object matching this schema EXACTLY:
{
  "company": "string (the company name)",
  "title": "string (the job title/role)",
  "location": "string (e.g. 'San Francisco, CA' or 'Remote')",
  "employmentType": "string (e.g. 'Full-time', 'Part-time', 'Contract')",
  "salary": "string (e.g. '$120,000 - $150,000')",
  "experience": "string (e.g. '5+ years')",
  "summary": "string (concise 2-3 sentence overview of the role)",
  "difficultyScore": "Easy" | "Medium" | "Hard",
  "difficultyReason": "string (brief explanation why: e.g. 'Requires 5+ years experience, system design, Kubernetes, AWS')",
  "jobQualityScore": number (integer 0 to 100 job description quality index)",
  "jobQualityReason": "string (explain rating: e.g. 'Salary listed, clear requirements, clear benefits')",
  "hiringSignals": ["string (signals like 'Strong DSA', 'System Design focus', 'High code quality expected')"],
  "interviewQuestions": ["string (3 expected interview questions based on tech stack)"],
  "hiddenRequirements": ["string (unspoken requirements like 'High scalability experience', 'Complex refactoring capability')"],
  "hiringStyle": ["string (e.g. 'DSA focused', 'System architecture focus', 'Speed and ownership')"],
  "interviewProcess": ["string (e.g. 'Phone Screen', 'Coding', 'System Design', 'Behavioral')"],
  "hiringInsights": ["string (e.g. 'Little frontend, strong backend focus', 'Candidate missing Docker might face screening challenge')"],
  "missingExperiences": ["string (e.g. 'Scaling', 'Leadership', 'Cloud Infrastructure')"],
  "responsibilities": ["string (list of core responsibilities)"],
  "requirements": [
    {
      "name": "string (e.g. 'Node.js', 'PostgreSQL')",
      "confidence": number (float from 0.0 to 1.0 representing extraction confidence)",
      "source": "string (always 'requirements')",
      "importance": "required" | "preferred" | "nice-to-have"
    }
  ],
  "benefits": ["string (list of benefits)"],
  "techStack": ["string (list of tools/technologies used)"],
  "keywords": [
    {
      "keyword": "string (e.g. 'Docker', 'Redis')",
      "group": "REQUIRED" | "PREFERRED" | "NICE_TO_HAVE"
    }
  ],
  "companyIntelligence": {
    "industry": "string (e.g. 'Technology')",
    "companySize": "string (e.g. '10,000+ employees')",
    "funding": "string (e.g. 'Public')",
    "engineeringCulture": "string (e.g. 'Collaborative, high velocity')",
    "interviewStyle": "string (e.g. 'Technical DSA & System Design')"
  }
}
Return only raw JSON. No markdown formatting, code blocks, or preamble.`;

        const aiResponse = await aiProvider.generateText({
          type: 'JOB_ANALYSIS',
          systemPrompt,
          messages: [{ role: 'user', content: `Job Title: ${title}\nCompany: ${company}\nDescription:\n${descriptionRaw}` }],
          responseFormat: 'json',
        });

        let cleanText = aiResponse.text.trim();
        if (cleanText.startsWith('```')) {
          cleanText = cleanText.replace(/^```json\s*/, '').replace(/```$/, '').trim();
        }

        const analysis = JSON.parse(cleanText);

        // Enqueue final stage: Database Write
        await jobQueue.add('db-save', {
          jobId,
          scraped: {
            title: title || company || 'Unknown Title',
            company: company || 'Unknown Company',
            descriptionRaw,
            location,
            salaryText,
          },
          analysis,
          userId,
        }, { priority: userId ? 0 : 100 });
      } catch (err) {
        console.error(`[Job Worker] AI extraction stage failed for Job ID: ${jobId}`, err);
        await prisma.job.update({
          where: { id: jobId },
          data: { status: 'FAILED' },
        }).catch((e) => console.error('Failed to mark job as FAILED', e));
        throw err;
      }
    }

    else if (name === 'db-save') {
      const { jobId, scraped, analysis, userId } = data;
      try {
        // 1. Semantic Duplicate Fingerprint: Company name + Job Title + Location (lowered, alphanumeric)
        const normCompany = (analysis.company || scraped.company || '').toLowerCase().replace(/[^a-z0-9]/g, '').trim();
        const normTitle = (analysis.title || scraped.title || '').toLowerCase().replace(/[^a-z0-9]/g, '').trim();
        const normLocation = (analysis.location || scraped.location || 'remote').toLowerCase().replace(/[^a-z0-9]/g, '').trim();
        const semanticFingerprint = crypto.createHash('sha256').update(`${normCompany}_${normTitle}_${normLocation}`).digest('hex');

        // Check if duplicate job exists
        const existing = await prisma.job.findUnique({
          where: { urlFingerprint: semanticFingerprint },
        });

        if (existing && existing.id !== jobId) {
          console.log(`[Job Worker] Duplicate job detected: ${existing.id} (Company: "${analysis.company}", Title: "${analysis.title}"). Deleting draft Job: ${jobId}`);
          await prisma.job.delete({
            where: { id: jobId },
          });
          return;
        }

        const cleanDescription = (scraped.descriptionRaw || '').toLowerCase().trim();

        // Save normalized tables inside transaction
        await prisma.$transaction(async (tx) => {
          // 1. Update Job root record
          await tx.job.update({
            where: { id: jobId },
            data: {
              title: analysis.title || scraped.title,
              company: analysis.company || scraped.company,
              descriptionRaw: scraped.descriptionRaw,
              urlFingerprint: semanticFingerprint,
              status: 'READY',
              sourceSite: `${analysis.company || scraped.company || 'Employer'} Careers`,
              lastVerifiedAt: new Date(),
              isLive: true,
            },
          });

          // 2. Create JobAnalysis with explainability and insights
          await tx.jobAnalysis.create({
            data: {
              jobId,
              summary: analysis.summary || 'Summary not provided.',
              difficultyScore: analysis.difficultyScore || 'Medium',
              difficultyReason: analysis.difficultyReason || 'Requires typical engineering skills.',
              jobQualityScore: analysis.jobQualityScore || 70,
              jobQualityReason: analysis.jobQualityReason || 'Standard requirements specified.',
              hiringSignals: analysis.hiringSignals || [],
              interviewQuestions: analysis.interviewQuestions || [],
              hiddenRequirements: analysis.hiddenRequirements || [],
              hiringStyle: analysis.hiringStyle || [],
              interviewProcess: analysis.interviewProcess || [],
              hiringInsights: analysis.hiringInsights || [],
              missingExperiences: analysis.missingExperiences || [],
              estimatedSalary: analysis.salary || scraped.salaryText || 'Market Rate',
              experienceRequired: analysis.experience || 'Not Specified',
            },
          });

          // 2b. Create CompanyIntelligence
          const compIntel = analysis.companyIntelligence || {};
          await tx.companyIntelligence.create({
            data: {
              jobId,
              companyName: analysis.company || scraped.company,
              industry: compIntel.industry || 'Technology',
              companySize: compIntel.companySize || 'Unknown Size',
              funding: compIntel.funding || 'Private',
              techStack: analysis.techStack || [],
              engineeringCulture: compIntel.engineeringCulture || 'Standard high-velocity environment',
              interviewStyle: compIntel.interviewStyle || 'Technical Interview',
            },
          });

          // 3. Create JobRequirements
          if (analysis.requirements && Array.isArray(analysis.requirements)) {
            await tx.jobRequirement.createMany({
              data: analysis.requirements.map((req: any) => ({
                jobId,
                name: req.name,
                confidence: req.confidence ?? 1.0,
                source: req.source ?? 'requirements',
                importance: req.importance ?? 'required',
              })),
            });
          }

          // 4. Create JobBenefits
          if (analysis.benefits && Array.isArray(analysis.benefits)) {
            await tx.jobBenefit.createMany({
              data: analysis.benefits.map((benefit: string) => ({
                jobId,
                benefit,
              })),
            });
          }

          // 5. Create JobKeywords
          if (analysis.keywords && Array.isArray(analysis.keywords)) {
            await tx.jobKeyword.createMany({
              data: analysis.keywords.map((kw: any) => ({
                jobId,
                keyword: kw.keyword,
                group: kw.group ?? 'REQUIRED',
              })),
            });
          }

          // 6. Create JobResponsibilities
          if (analysis.responsibilities && Array.isArray(analysis.responsibilities)) {
            await tx.jobResponsibility.createMany({
              data: analysis.responsibilities.map((responsibility: string) => ({
                jobId,
                responsibility,
              })),
            });
          }

          // 7. Create JobMetadata
          await tx.jobMetadata.create({
            data: {
              jobId,
              location: analysis.location || scraped.location || 'Remote',
              salaryText: analysis.salary || scraped.salaryText || 'Market Rate',
              employmentType: analysis.employmentType || 'Full-time',
              techStack: analysis.techStack || [],
              normalizedDescription: cleanDescription,
              importedBy: userId || 'system',
            },
          });
        });

        // 8. Generate & store job embedding
        try {
          console.log(`[Job Worker] Generating embedding for Job ID: ${jobId}`);
          const textToEmbed = `Company: ${analysis.company}\nTitle: ${analysis.title}\nDescription:\n${scraped.descriptionRaw}`;
          const embedResult = await aiProvider.generateEmbedding({ text: textToEmbed });
          const vector = embedResult.embeddings[0];
          const vectorStr = `[${vector.join(',')}]`;

          await prisma.$executeRawUnsafe(
            `UPDATE jobs SET embedding = $1::vector WHERE id = $2`,
            vectorStr,
            jobId
          );
          console.log(`[Job Worker] Stored embedding for Job ID: ${jobId}`);
        } catch (embedErr) {
          console.error(`[Job Worker] Failed to compute/store embedding for Job ${jobId}:`, embedErr);
        }

        // 9. Cache analysis in AIOutput table
        await prisma.aIOutput.create({
          data: {
            type: 'JOB_ANALYSIS',
            inputRefType: 'job',
            inputRefId: jobId,
            providerUsed: 'gemini',
            promptVersion: '1.0',
            outputJson: analysis,
          },
        });

        console.log(`[Job Worker] Job ID: ${jobId} successfully ingested, fingerprinted, and analyzed.`);

        // Trigger auto-match against all ready resumes
        try {
          console.log(`[Job Worker] Triggering auto-match for Job ${jobId} against all ready resumes...`);
          const readyResumes = await prisma.resume.findMany({
            where: { status: 'READY' },
            include: { versions: { orderBy: { createdAt: 'desc' }, take: 1 } },
          });

          for (const resume of readyResumes) {
            const version = resume.versions[0];
            if (version) {
              await comparisonQueue.add('compare', {
                resumeVersionId: version.id,
                jobId,
              }, { priority: 100 });
            }
          }
        } catch (matchErr) {
          console.error('[Job Worker] Failed to enqueue auto-comparisons for job:', matchErr);
        }

      } catch (err) {
        console.error(`[Job Worker] Database save stage failed for Job ID: ${jobId}`, err);
        await prisma.job.update({
          where: { id: jobId },
          data: { status: 'FAILED' },
        }).catch((e) => console.error('Failed to mark job as FAILED', e));
        throw err;
      }
    }
  },
  {
    connection: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
    },
  }
);

// Define list of discovered jobs to feed in background
async function discoverLiveJobs() {
  console.log('[Job Discovery] Running periodic provider sync & status checker...');
  try {
    const discovery = new JobDiscoveryService();
    const activeConfigs = await prisma.jobProviderConfiguration.findMany({
      where: { enabled: true },
    });

    const keywords = ['software engineer', 'backend engineer', 'frontend engineer', 'ai engineer'];

    for (const config of activeConfigs) {
      console.log(`[Job Discovery] Syncing active provider: "${config.providerName}"...`);
      for (const kw of keywords) {
        const ids = await discovery.discoverAndIngest(kw, config.credentialsJson || {});
        
        // Auto-extract/analyze newly created jobs
        for (const id of ids) {
          const jobRec = await prisma.job.findUnique({ where: { id } });
          if (jobRec) {
            // Jobs from structured APIs already have clean data — mark READY directly.
            const apiSourcedPlatforms = ['greenhouse', 'lever', 'ashby', 'remoteok', 'company_careers'];
            if (apiSourcedPlatforms.includes(jobRec.sourcePlatform)) {
              await prisma.job.update({
                where: { id: jobRec.id },
                data: { status: 'READY' },
              });
            } else {
              await jobQueue.add('ai-extract', {
                jobId: jobRec.id,
                descriptionRaw: jobRec.descriptionRaw,
                title: jobRec.title,
                company: jobRec.company,
                location: 'Remote',
                salaryText: null,
                userId: null,
              }, { priority: 100 });
            }
          }
        }
      }
    }

    // Verify existing active jobs
    await discovery.verifyExistingJobs();
  } catch (err) {
    console.error('[Job Discovery] Error during auto-ingestion:', err);
  }
}

// Start discovery service on load after 2 minutes, then every 6 hours
// This preserves AI quota for user-facing tailoring/cover-letter generation
setTimeout(discoverLiveJobs, 1000 * 60 * 2);
setInterval(discoverLiveJobs, 1000 * 60 * 60 * 6);
