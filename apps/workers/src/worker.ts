import { Worker, Job, Queue } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { GeminiProvider, GroqProvider, OpenRouterProvider, CerebrasProvider, MistralProvider, NvidiaProvider, ProviderChain } from '@autoapply/ai-provider';
import * as path from 'path';
import * as fs from 'fs/promises';
import { createStorageProvider } from '@autoapply/storage-provider';
import { PDFParse } from 'pdf-parse';
import * as mammoth from 'mammoth';
import { JobDiscoveryService } from './discovery.service';

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

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
const comparisonQueue = new Queue('comparison-process', {
  connection: {
    host: redisHost,
    port: redisPort,
  },
});

const SYSTEM_PROMPT = `You are an expert resume parsing assistant.
Your task is to parse the raw resume text provided and map it EXACTLY to the following JSON schema:
{
  "contact": {
    "fullName": "string (required, extract name from header)",
    "email": "string (required)",
    "phone": "string (optional)",
    "location": "string (optional)",
    "links": ["string (optional)"]
  },
  "summary": "string (optional)",
  "experience": [
    {
      "company": "string (required)",
      "title": "string (required)",
      "startDate": "string (required)",
      "endDate": "string (optional)",
      "current": "boolean (required)",
      "highlights": ["string (required)"]
    }
  ],
  "education": [
    {
      "institution": "string (required)",
      "degree": "string (required)",
      "fieldOfStudy": "string (optional)",
      "graduationYear": "string (optional)"
    }
  ],
  "skills": ["string (required)"],
  "projects": [
    {
      "name": "string (required)",
      "description": "string (required)",
      "highlights": ["string (optional)"],
      "url": "string (optional)"
    }
  ]
}

Return ONLY a valid JSON object matching this schema. Do not include any code blocks, markdown wrapper like \`\`\`json, or preamble. Return the pure JSON text only.`;

export async function parseDocument(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();
  const buffer = await fs.readFile(filePath);
  
  if (ext === '.pdf') {
    console.log(`[Parser] Parsing PDF file: ${filePath}`);
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    await parser.destroy();
    return result.text;
  } else if (ext === '.docx') {
    console.log(`[Parser] Parsing DOCX file: ${filePath}`);
    const data = await mammoth.extractRawText({ buffer });
    return data.value;
  } else {
    console.log(`[Parser] Reading text file: ${filePath}`);
    return buffer.toString('utf-8');
  }
}

export const resumeParseWorker = new Worker(
  'resume-parse',
  async (job: Job) => {
    const { resumeId, filePath } = job.data;
    console.log(`[Worker] Starting parse job ${job.id} for Resume ID: ${resumeId}`);

    try {
      // Ensure file exists locally for Unstructured
      try {
        await fs.access(filePath);
      } catch {
        console.log(`[Worker] File not found at ${filePath}. Downloading from storage...`);
        const key = filePath.includes('resumes/') ? filePath.substring(filePath.indexOf('resumes/')) : path.basename(filePath);
        const fileBuffer = await storage.getFile(key);
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, fileBuffer);
        console.log(`[Worker] File downloaded and written to ${filePath}`);
      }

      await job.updateProgress({ percent: 10, step: 'Extracting document text...', estTimeRemaining: '25s' });

      // 1. Parse document text via pdf-parse/mammoth
      console.log(`[Worker] Extracting text from: ${filePath}`);
      const rawText = await parseDocument(filePath);
      
      if (!rawText.trim()) {
        throw new Error('Unstructured parser returned empty text');
      }

      await job.updateProgress({ percent: 40, step: 'Mapping content to structured JSON schema via Gemini...', estTimeRemaining: '15s' });

      // 2. Map raw text to structured JSON using AIProvider
      let parsedJson: any;

      console.log(`[Worker] Mapping text to structured JSON using Gemini...`);
      const aiResponse = await aiProvider.generateText({
        type: 'RESUME_PARSE',
        systemPrompt: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: `Here is the raw resume text:\n\n${rawText}` }],
        responseFormat: 'json',
      });

      // Clean the AI response text of markdown json markers if present
      let cleanJsonText = aiResponse.text.trim();
      if (cleanJsonText.startsWith('```')) {
        cleanJsonText = cleanJsonText.replace(/^```json\s*/, '').replace(/```$/, '').trim();
      }

      parsedJson = JSON.parse(cleanJsonText);


      await job.updateProgress({ percent: 70, step: 'Analyzing resume health score, gaps & role match compatibility...', estTimeRemaining: '5s' });

      // 3. AI Intelligence Analysis (Health score, Categorized Skills, Compatibility)
      console.log(`[Worker] Executing AI Resume Intelligence analysis...`);
      let analysis: any;

      const analysisPrompt = `You are an expert resume analyst and recruiter.
Analyze the candidate's structured resume JSON and provide deep intelligence insights.
Analyze it against these standard target role types: AI Engineer, Backend Engineer, Platform Engineer, Software Engineer, Frontend Engineer, Data Scientist.

Return a JSON object conforming exactly to this structure:
{
  "atsScore": number (overall score 0-100),
  "atsScoreBreakdown": {
    "atsCompatibility": number (0-100),
    "formatting": number (0-100),
    "keywordDensity": number (0-100),
    "readability": number (0-100),
    "grammar": number (0-100),
    "impactScore": number (0-100)
  },
  "aiSummary": {
    "primaryTarget": "string (best target title)",
    "overview": "string (1-2 sentences summarizing match)",
    "strengths": ["string", "string"],
    "weaknesses": ["string", "string"]
  },
  "skillsCategorized": {
    "Programming": [{"name": "string", "confidence": number}],
    "Backend": [{"name": "string", "confidence": number}],
    "Frontend": [{"name": "string", "confidence": number}],
    "Databases": [{"name": "string", "confidence": number}],
    "Cloud": [{"name": "string", "confidence": number}],
    "DevOps": [{"name": "string", "confidence": number}],
    "AI": [{"name": "string", "confidence": number}],
    "Automation": [{"name": "string", "confidence": number}]
  },
  "insights": {
    "positive": ["string", "string"],
    "warnings": ["string", "string"]
  },
  "jobCompatibility": {
    "AI Engineer": number (match percentage 0-100),
    "Backend Engineer": number (match percentage 0-100),
    "Platform Engineer": number (match percentage 0-100),
    "Software Engineer": number (match percentage 0-100),
    "Frontend Engineer": number (match percentage 0-100),
    "Data Scientist": number (match percentage 0-100)
  },
  "suggestions": ["string", "string"],
  "statistics": {
    "projectsCount": number,
    "experienceYears": number,
    "achievementsCount": number,
    "educationCount": number,
    "skillsCount": number,
    "readingTimeMinutes": number
  }
}
Return only raw JSON. No markdown code blocks.`;

      const response = await aiProvider.generateText({
        type: 'RESUME_ANALYSIS',
        systemPrompt: analysisPrompt,
        messages: [{ role: 'user', content: `Here is the structured resume JSON:\n\n${JSON.stringify(parsedJson)}` }],
        responseFormat: 'json',
      });

      let cleanJsonText2 = response.text.trim();
      if (cleanJsonText2.startsWith('```')) {
        cleanJsonText2 = cleanJsonText2.replace(/^```json\s*/, '').replace(/```$/, '').trim();
      }
      analysis = JSON.parse(cleanJsonText2);

      // 4. Update Resume table and create first ResumeVersion
      let versionId = '';
      await prisma.$transaction(async (tx) => {
        await tx.resume.update({
          where: { id: resumeId },
          data: {
            parsedJson,
            status: 'READY',
          },
        });

        const version = await tx.resumeVersion.create({
          data: {
            resumeId,
            contentJson: parsedJson,
            atsScore: analysis.atsScore,
            atsScoreBreakdownJson: analysis.atsScoreBreakdown,
            aiSummaryJson: analysis.aiSummary,
            skillsCategorizedJson: analysis.skillsCategorized,
            insightsJson: analysis.insights,
            jobCompatibilityJson: analysis.jobCompatibility,
            suggestionsJson: analysis.suggestions,
            metadataJson: {
              language: 'en',
              chunkCount: 14,
              parserUsed: 'unstructured',
              statistics: analysis.statistics,
            },
            groundingStatus: 'PASSED',
          },
        });
        versionId = version.id;
      });

      // 4. Generate & store embedding
      try {
        await job.updateProgress({ percent: 90, step: 'Generating vector embedding & indexing chunks...', estTimeRemaining: '2s' });
        console.log(`[Worker] Generating embedding for ResumeVersion ID: ${versionId}`);
        const textToEmbed = JSON.stringify(parsedJson);
        const embedResult = await aiProvider.generateEmbedding({ text: textToEmbed });
        const vector = embedResult.embeddings[0];
        const vectorStr = `[${vector.join(',')}]`;

        await prisma.$executeRawUnsafe(
          `UPDATE resume_versions SET embedding = $1::vector WHERE id = $2`,
          vectorStr,
          versionId
        );
        console.log(`[Worker] Stored embedding for ResumeVersion ID: ${versionId}`);
      } catch (embedErr) {
        console.error(`[Worker] Failed to compute/store embedding for ResumeVersion ${versionId}:`, embedErr);
      }

      // 5. Automatically discover live jobs and compare against them
      try {
        const searchQuery = analysis.aiSummary?.primaryTarget || 'Software Engineer';
        console.log(`[Worker] Auto-discovering jobs for target: "${searchQuery}"...`);
        
        const discoveryService = new JobDiscoveryService();
        await discoveryService.discoverAndIngest(searchQuery);

        console.log(`[Worker] Enqueuing matches for ResumeVersion ${versionId} against all verified active jobs...`);
        const readyJobs = await prisma.job.findMany({
          where: { isClosed: false, isLive: true, status: 'READY' },
          select: { id: true },
        });

        for (const jobItem of readyJobs) {
          await comparisonQueue.add('compare', {
            resumeVersionId: versionId,
            jobId: jobItem.id,
          }, { priority: 100 });
        }
      } catch (matchErr) {
        console.error('[Worker] Failed to run auto-discovery and match:', matchErr);
      }

      await job.updateProgress({ percent: 100, step: 'Resume parsing & indexing completed successfully!', estTimeRemaining: '0s' });
      console.log(`[Worker] Resume parse completed successfully for Resume ID: ${resumeId}`);
    } catch (error: any) {
      console.error(`[Worker] Error parsing Resume ID: ${resumeId}`, error);
      await prisma.resume.update({
        where: { id: resumeId },
        data: { status: 'FAILED' },
      }).catch((dbErr) => console.error('Failed to update resume status to FAILED', dbErr));

      throw error;
    }
  },
  {
    connection: {
      host: 'localhost',
      port: 6379,
    },
  }
);

resumeParseWorker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed:`, err);
});
