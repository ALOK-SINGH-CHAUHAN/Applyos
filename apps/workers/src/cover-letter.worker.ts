import { Worker, Job as BullJob } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { ProviderChain, GeminiProvider, GroqProvider, OpenRouterProvider, CerebrasProvider, MistralProvider, NvidiaProvider } from '@autoapply/ai-provider';

const prisma = new PrismaClient();
const aiProvider = new ProviderChain([
  new GeminiProvider(),
  new GroqProvider(),
  new CerebrasProvider(),
  new NvidiaProvider(),
  new MistralProvider(),
  new OpenRouterProvider(),
]);

export const coverLetterWorker = new Worker(
  'cover-letter-process',
  async (job: BullJob) => {
    const { resumeVersionId, jobId, applicationId } = job.data;
    console.log(`[Cover Letter Worker] Generating letter for Resume Version: ${resumeVersionId}, Job: ${jobId}, App: ${applicationId}`);

    try {
      let activeVersionId = resumeVersionId;
      if (applicationId) {
        await prisma.application.update({
          where: { id: applicationId },
          data: { status: 'LETTER_GENERATING' },
        }).catch(() => {});

        const app = await prisma.application.findUnique({
          where: { id: applicationId }
        });
        if (app && app.resumeVersionId) {
          activeVersionId = app.resumeVersionId;
        }
      }

      console.log(`[Cover Letter Worker] Generating letter for Resume Version: ${activeVersionId}, Job: ${jobId}, App: ${applicationId}`);

      // 1. Fetch details
      const resumeVersion = await prisma.resumeVersion.findUnique({
        where: { id: activeVersionId },
      });
      const targetJob = await prisma.job.findUnique({
        where: { id: jobId },
      });

      if (!resumeVersion || !targetJob) {
        throw new Error('Resume version or target job not found');
      }

      await job.updateProgress({ percent: 20, step: 'Drafting cover letter outlines...', provider: 'Gemini' });

      // 2. Prompt LLM
      const coverLetterSystemPrompt = `You are a professional copywriter.
Write a highly engaging, persuasive, and custom cover letter based on the candidate's tailored resume and the job description.
Do not invent facts not present in the resume. Focus on the candidate's actual achievements.
Output only the cover letter text, properly structured with greeting, body paragraphs, and sign-off.
Keep the tone confident, concise, and professional.`;

      const coverLetterUserMessage = `Tailored Resume:\n${JSON.stringify(resumeVersion.contentJson)}\n\nJob Title: ${targetJob.title}\nCompany: ${targetJob.company}\nDescription:\n${targetJob.descriptionRaw}`;

      const aiResponse = await aiProvider.generateText({
        type: 'COVER_LETTER',
        systemPrompt: coverLetterSystemPrompt,
        messages: [{ role: 'user', content: coverLetterUserMessage }],
      });

      await job.updateProgress({ percent: 85, step: 'Saving cover letter text to database...' });

      // 3. Save to database
      // Delete existing cover letter for this application if it exists
      await prisma.coverLetter.deleteMany({
        where: { applicationId }
      });

      const coverLetter = await prisma.coverLetter.create({
        data: {
          applicationId,
          content: aiResponse.text.trim(),
          tonePreset: 'professional',
        },
      });

      if (applicationId) {
        await prisma.application.update({
          where: { id: applicationId },
          data: {
            coverLetterId: coverLetter.id,
            status: 'LETTER_READY',
          },
        }).catch(() => {});
      }

      await job.updateProgress({ percent: 100, step: 'Cover letter generated successfully.' });
      return coverLetter;
    } catch (err) {
      console.error('[Cover Letter Worker] Failed:', err);
      if (applicationId) {
        await prisma.application.update({
          where: { id: applicationId },
          data: { status: 'FAILED' },
        }).catch(() => {});
      }
      throw err;
    }
  },
  {
    connection: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
    },
    concurrency: parseInt(process.env.CONCURRENCY_COVER_LETTER || '3', 10),
  }
);
