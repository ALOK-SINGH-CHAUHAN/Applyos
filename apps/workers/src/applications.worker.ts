import { Worker, Job as BullJob } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { GeminiProvider, GroqProvider, OpenRouterProvider, CerebrasProvider, MistralProvider, NvidiaProvider, ProviderChain } from '@autoapply/ai-provider';

const prisma = new PrismaClient();
const aiProvider = new ProviderChain([
  new GeminiProvider(),
  new GroqProvider(),
  new CerebrasProvider(),
  new NvidiaProvider(),
  new MistralProvider(),
  new OpenRouterProvider(),
]);

function calculateAtsScore(resumeText: string, keywords: string[]): number {
  if (!keywords || keywords.length === 0) return 80; // Baseline
  
  const textLower = resumeText.toLowerCase();
  let matches = 0;
  
  for (const keyword of keywords) {
    if (textLower.includes(keyword.toLowerCase())) {
      matches++;
    }
  }
  
  const score = Math.round((matches / keywords.length) * 100);
  return Math.max(50, Math.min(100, score)); // Constrain between 50 and 100
}

export const applicationProcessWorker = new Worker(
  'application-process',
  async (bullJob: BullJob) => {
    const { applicationId, jobId, resumeVersionId } = bullJob.data;
    console.log(`[App Worker] Starting tailoring & validation for Application ID: ${applicationId}`);

    try {
      // 1. Fetch relations
      const app = await prisma.application.findUnique({
        where: { id: applicationId },
        include: {
          job: {
            include: {
              keywords: true,
            },
          },
          resumeVersion: true,
        },
      });

      if (!app) {
        throw new Error(`Application ${applicationId} not found`);
      }

      const job = app.job;
      const baseVersion = app.resumeVersion;
      const baseResumeJson = baseVersion.contentJson as any;

      // 2. AI Tailoring Prompt
      const tailorSystemPrompt = `You are an expert resume writer and ATS optimization specialist.
Your task is to tailor a candidate's resume for a specific job description.
Modify only the experience highlights and skills list to better align with the required skills and keywords.
CRITICAL CONSTRAINT: Do NOT change employer names, dates of employment, job titles, education, or project names.
Do NOT invent new responsibilities or skills that the candidate does not have. Only rephrase, emphasize, and highlight relevant matching skills.
Output a JSON object conforming exactly to the candidate resume schema.
Return only the raw JSON. No markdown code blocks or preamble.`;

      const tailorUserMessage = `Base Resume:\n${JSON.stringify(baseResumeJson)}\n\nJob Title: ${job.title}\nCompany: ${job.company}\nJob Description:\n${job.descriptionRaw}`;

      console.log(`[App Worker] Calling Gemini to tailor resume...`);
      const tailorResponse = await aiProvider.generateText({
        systemPrompt: tailorSystemPrompt,
        messages: [{ role: 'user', content: tailorUserMessage }],
        responseFormat: 'json',
      });

      let cleanTailoredText = tailorResponse.text.trim();
      if (cleanTailoredText.startsWith('```')) {
        cleanTailoredText = cleanTailoredText.replace(/^```json\s*/, '').replace(/```$/, '').trim();
      }

      const tailoredJson = JSON.parse(cleanTailoredText);

      // 3. Grounding Validator (Anti-Fabrication Check)
      console.log(`[App Worker] Running Grounding Audit on tailored resume highlights...`);
      const groundingSystemPrompt = `You are a compliance officer auditing resumes for factual truth.
Compare the original resume experience highlights with the tailored resume highlights.
Identify any highlights in the tailored resume that introduce new claims, technologies, or scales of work NOT supported by the original highlights.
Return a JSON object conforming exactly to this schema:
{
  "groundingStatus": "PASSED" | "FAILED",
  "auditFailures": [
    {
      "company": "string (company name)",
      "originalHighlightIndex": number (index of the highlight in the company's experience list),
      "failedReason": "string (explanation of the fabrication)"
    }
  ]
}
Return only the raw JSON. No code blocks.`;

      const groundingUserMessage = `Original Experience:\n${JSON.stringify(baseResumeJson.experience)}\n\nTailored Experience:\n${JSON.stringify(tailoredJson.experience)}`;

      const auditResponse = await aiProvider.generateText({
        systemPrompt: groundingSystemPrompt,
        messages: [{ role: 'user', content: groundingUserMessage }],
        responseFormat: 'json',
      });

      let cleanAuditText = auditResponse.text.trim();
      if (cleanAuditText.startsWith('```')) {
        cleanAuditText = cleanAuditText.replace(/^```json\s*/, '').replace(/```$/, '').trim();
      }

      const auditResult = JSON.parse(cleanAuditText);
      console.log(`[App Worker] Grounding Audit result: ${auditResult.groundingStatus}`);

      // 4. Grounding Self-Correction (Revert Fabrications)
      let finalTailoredJson = { ...tailoredJson };
      let groundingStatus = 'PASSED';
      let diffJson: any = {};

      if (auditResult.groundingStatus === 'FAILED' && auditResult.auditFailures?.length > 0) {
        console.log(`[App Worker] Grounding failed for ${auditResult.auditFailures.length} highlights. Self-correcting...`);
        groundingStatus = 'SELF_CORRECTED';

        for (const failure of auditResult.auditFailures) {
          const companyName = failure.company;
          const index = failure.originalHighlightIndex;

          const baseComp = baseResumeJson.experience.find((e: any) => e.company.toLowerCase() === companyName.toLowerCase());
          const tailoredComp = finalTailoredJson.experience.find((e: any) => e.company.toLowerCase() === companyName.toLowerCase());

          if (baseComp && tailoredComp && baseComp.highlights[index] && tailoredComp.highlights[index]) {
            console.log(`[App Worker] Reverting highlight ${index} for ${companyName} to original.`);
            diffJson[`${companyName}_highlight_${index}`] = {
              tailoredAttempt: tailoredComp.highlights[index],
              revertedTo: baseComp.highlights[index],
              reason: failure.failedReason,
            };
            // Revert back to original base highlight
            tailoredComp.highlights[index] = baseComp.highlights[index];
          }
        }
      }

      // 5. Compute ATS Score
      const keywords = (job as any).keywords?.map((k: any) => k.keyword) || [];
      const resumeString = JSON.stringify(finalTailoredJson);
      const atsScore = calculateAtsScore(resumeString, keywords);

      // 6. Save tailored ResumeVersion
      const tailoredVersion = await prisma.resumeVersion.create({
        data: {
          resumeId: baseVersion.resumeId,
          sourceVersionId: baseVersion.id,
          tailoredForJobId: jobId,
          contentJson: finalTailoredJson,
          atsScore,
          groundingStatus,
          diffJson: diffJson,
        },
      });

      // 7. Generate Cover Letter
      console.log(`[App Worker] Generating tailored cover letter...`);
      const coverLetterSystemPrompt = `You are a professional copywriter.
Write a highly engaging, persuasive, and custom cover letter based on the candidate's tailored resume and the job description.
Do not invent facts not present in the resume. Focus on the candidate's actual achievements.
Output only the cover letter text, properly structured with greeting, body paragraphs, and sign-off.
Keep the tone confident, concise, and professional.`;

      const coverLetterUserMessage = `Tailored Resume:\n${JSON.stringify(finalTailoredJson)}\n\nJob Title: ${job.title}\nCompany: ${job.company}\nDescription:\n${job.descriptionRaw}`;

      const coverLetterResponse = await aiProvider.generateText({
        systemPrompt: coverLetterSystemPrompt,
        messages: [{ role: 'user', content: coverLetterUserMessage }],
      });

      const coverLetter = await prisma.coverLetter.create({
        data: {
          applicationId,
          content: coverLetterResponse.text.trim(),
          tonePreset: 'professional',
        },
      });

      // 8. Update Application
      await prisma.application.update({
        where: { id: applicationId },
        data: {
          resumeVersionId: tailoredVersion.id,
          coverLetterId: coverLetter.id,
          status: 'READY_FOR_REVIEW',
        },
      });

      console.log(`[App Worker] Application ID: ${applicationId} tailoring & grounding check complete. Status updated to READY_FOR_REVIEW.`);
    } catch (err) {
      console.error(`[App Worker] Failed to process Application ID: ${applicationId}`, err);
      await prisma.application.update({
        where: { id: applicationId },
        data: { status: 'FAILED' },
      }).catch((dbErr) => console.error('Failed to mark application as FAILED', dbErr));
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
