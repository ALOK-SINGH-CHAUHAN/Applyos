# AutoApply — AI-Powered Job Application Automation Platform
### Product Requirements Document & Technical Design Document
**Version 1.0 · Confidential · Engineering-Ready Specification**

---

## 1. Executive Summary

AutoApply is an enterprise-grade platform that automates the entire job-search lifecycle for a candidate managing a large, heterogeneous resume library: ingesting resumes, discovering and scraping job postings, using AI to match and tailor resumes without fabricating experience, generating ATS-optimized documents and cover letters/proposals, and — where permitted by the target platform — submitting applications via resilient browser automation. It replaces a spreadsheet-and-copy-paste workflow with a queue-driven, auditable, plugin-extensible system that can scale from a single power user to a team.

The MVP runs entirely on free-tier infrastructure: Google Gemini (primary LLM), OpenRouter and Groq free models (fallback), and a single Oracle Cloud "Always Free" VM running the full stack under Docker Compose. The architecture is designed so that every constrained choice (LLM provider, hosting, storage) is swappable behind an interface, so the system can grow into a multi-tenant SaaS product without a rewrite.

Non-negotiable product principle: **the AI tailors and reformats; it never invents.** Every generated claim in a resume or cover letter must be traceable to source content the user provided. This is enforced architecturally (grounded generation + diff/provenance tracking), not just by prompt instruction.

---

## 2. Product Vision

**Vision statement:** *Give any job seeker or freelancer the leverage of a full-time application team — sourcing roles, matching them intelligently against real experience, and producing submission-ready materials — while keeping a human firmly in control of what gets said and what gets sent.*

**Who it's for:**
- Individual power users applying at volume (new grads, career switchers, freelancers on Upwork/Guru/PeoplePerHour).
- Small career-coaching businesses managing applications for multiple clients.
- Later: recruiting agencies and staffing firms (multi-tenant).

**Product pillars:**
1. **Trustworthy AI** — grounded, auditable, no fabrication, human-review gate before any external submission.
2. **Operational scale** — hundreds of resumes, thousands of jobs/day, queue-based so nothing blocks on slow AI or browser calls.
3. **Extensibility** — every job site is a plugin; every LLM is a provider; every document format is a template.
4. **Cost discipline** — MVP must run for $0/month in compute and AI spend.

---

## 3. User Stories

**Resume management**
- As a user, I can upload 100s of resumes (PDF/DOCX) and have them parsed into structured, versioned records so I don't manually re-enter data.
- As a user, I can see which resume version was used for which application, so I can track what I actually sent.

**Job discovery**
- As a user, I can paste a job URL (or a list of URLs) from any supported site and have the description scraped and normalized automatically.
- As a user, I want the system to detect and block duplicate job imports (same company + title + normalized URL) so I don't waste AI calls or apply twice.

**AI matching & tailoring**
- As a user, I want the system to rank my resume library against a job and recommend the best base resume, with a confidence score and explanation.
- As a user, I want a tailored, ATS-friendly version of that resume for the specific job, with every changed line visibly diffed against the source so I can verify nothing was fabricated.
- As a user, I want an auto-generated cover letter or freelance proposal in my own voice/tone, grounded in the same resume content.

**Application automation**
- As a user, I want the system to submit the application through the target site's own form, with screenshots and a status log, but only after I've approved the generated materials (configurable auto-submit only for whitelisted low-risk plugins).
- As a user, I want retries with backoff on transient failures, and a clear "needs manual action" state when a captcha or unusual form appears.

**Tracking & analytics**
- As a user, I want a Kanban-style tracker of applications (Queued → Applied → Interview → Offer/Rejected) and a dashboard of success rates by resume, by site, and by role type.

**Admin/Enterprise**
- As an admin, I can configure RBAC roles, view audit logs of every AI generation and every submission action, and rotate credentials/secrets for site logins.

---

## 4. Functional Requirements

| ID | Requirement |
|---|---|
| FR-1 | System shall ingest resumes in PDF/DOCX, parse to structured JSON (contact, summary, experience, education, skills, projects), and store both original file and parsed representation. |
| FR-2 | System shall version resumes; every AI-tailored output creates a new immutable Resume Version linked to its parent. |
| FR-3 | System shall import jobs by URL, detect the source platform via plugin registry, and scrape title, company, description, requirements, location, salary (if present), and posting URL. |
| FR-4 | System shall compute a normalized fingerprint (company + title + URL hash) per job and reject duplicate imports. |
| FR-5 | System shall run AI Job Analysis to extract required skills, seniority, keywords, and an ATS-relevant keyword list. |
| FR-6 | System shall rank all eligible resumes against a job using embedding similarity + LLM re-ranking, returning top-N with a confidence score. |
| FR-7 | System shall generate a tailored resume constrained to facts present in the source resume's structured data (no new employers, titles, dates, or skills not already present or explicitly user-approved). |
| FR-8 | System shall produce an ATS-compatibility score (formatting, keyword coverage, section structure) for every generated resume. |
| FR-9 | System shall generate cover letters and freelance proposals from the same grounded context, with selectable tone presets. |
| FR-10 | System shall support a Human Review Mode gate: no external submission occurs until the user approves generated content (default ON; can be relaxed per-plugin for trusted low-risk flows). |
| FR-11 | System shall submit applications via Playwright/Stagehand plugins implementing a common `JobPlatformPlugin` interface (login, extractJob, uploadResume, answerQuestions, submit). |
| FR-12 | System shall capture screenshots and structured logs at each browser automation step and store them against the Application record. |
| FR-13 | System shall retry transient automation failures with exponential backoff and a max-attempt ceiling, then mark the application `needs_manual_action`. |
| FR-14 | System shall track application status through a defined state machine and allow manual status correction. |
| FR-15 | System shall provide analytics: resume usage, per-site success rate, funnel conversion, AI acceptance rate, weekly digest. |
| FR-16 | System shall expose a plugin marketplace UI listing installed/available site adapters and their capability flags (auto-submit supported, requires manual, login type). |
| FR-17 | System shall support RBAC roles (Owner, Admin, Operator, Viewer) at the workspace level. |

---

## 5. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Scale | Support 500+ stored resumes, ingestion of up to 10,000 job records/day, and at least 20 concurrent background workers on a single Oracle Free VM (4 OCPU / 24GB ARM shape), horizontally extensible later. |
| Reliability | All expensive/external operations (parsing, embedding, AI generation, browser automation) run as idempotent BullMQ jobs with retry + dead-letter queues; API requests never block on them. |
| Idempotency | Every job/task carries an idempotency key derived from its business identity (e.g., `resumeId:jobId:taskType`) to prevent duplicate processing on retry or redelivery. |
| Security | Encrypted-at-rest credential storage for site logins, JWT-based auth via Better Auth, RBAC enforcement at the service layer, full audit log of AI and automation actions, per-route rate limiting. |
| Observability | Structured logging (Pino) shipped to a central sink, error tracking via Sentry, per-queue metrics (depth, latency, failure rate) exposed for dashboarding. |
| Cost | MVP operates within free tiers: Gemini free tier, OpenRouter/Groq free models, Oracle Always Free compute, local disk storage (S3-compatible interface for future migration). |
| Extensibility | New job-site plugin addable without core service changes; new AI provider addable by implementing a single interface; no direct SDK calls to any LLM vendor from business logic. |
| Data integrity | AI-generated resume content must pass a grounding check (every new/changed sentence maps to source resume fields) before being marked `ready_for_review`. |

---

## 6. Technical Architecture

### 6.1 Layered view

```
Presentation Layer        Next.js 15 (App Router) — Dashboard, Resume/Job/App mgmt, Analytics
        ↓
API Gateway                NestJS Gateway — Auth (Better Auth), REST + WS, rate limiting, RBAC
        ↓
Domain Services             Resume · Job · Application · Analytics · Plugin · Notification services
        ↓
AI Layer                    AIProvider abstraction → Gemini → OpenRouter → Groq
                             LlamaIndex (RAG orchestration) · pgvector (retrieval)
        ↓
Automation Layer            JobPlatformPlugin registry → Playwright/Stagehand workers → ghost-cursor
        ↓
Queue Layer                  BullMQ (Redis-backed) — parsing, embedding, AI, automation, notification queues
        ↓
Persistence Layer            PostgreSQL (Prisma ORM) + pgvector, Redis (cache/queue), local/S3 file storage
        ↓
Infrastructure                Docker Compose, Nginx (TLS termination + reverse proxy), Oracle Cloud VM
```

### 6.2 AI Provider abstraction (critical design constraint)

Business logic never imports a vendor SDK directly. All AI calls go through a single port:

```typescript
// packages/ai-provider/src/ai-provider.interface.ts
export interface AIProvider {
  name: string;
  generateText(input: GenerateTextInput): Promise<GenerateTextOutput>;
  generateEmbedding(input: EmbeddingInput): Promise<EmbeddingOutput>;
  supportsStructuredOutput: boolean;
}

export interface GenerateTextInput {
  systemPrompt: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
  responseFormat?: 'text' | 'json';
  maxTokens?: number;
}
```

```typescript
// packages/ai-provider/src/provider-chain.ts
export class ProviderChain implements AIProvider {
  name = 'chain';
  constructor(private providers: AIProvider[]) {}

  async generateText(input: GenerateTextInput) {
    let lastError: unknown;
    for (const provider of this.providers) {
      try {
        return await withTimeout(provider.generateText(input), 20_000);
      } catch (err) {
        lastError = err;
        logger.warn(`Provider ${provider.name} failed, falling back`, err);
      }
    }
    throw new AllProvidersFailedError(lastError);
  }
}
```

### 6.3 Grounded generation (anti-fabrication enforcement)

1. Resume Service exposes candidate's structured resume JSON (facts only).
2. AI Worker prompt is constructed as: system instruction + structured JSON + job keywords.
3. Output required in structured JSON (`responseFormat: 'json'`).
4. Grounding Validator checks every new/changed field against source.

---

## 7. Database Design (PostgreSQL via Prisma)

### 7.1 Core entities

```
User(id, email, name, role, workspace_id, created_at)
Workspace(id, name, plan, created_at)

Resume(id, user_id, title, original_file_url, parsed_json, status, created_at)
ResumeVersion(id, resume_id, source_version_id NULLABLE, tailored_for_job_id NULLABLE,
               content_json, ats_score, grounding_status, diff_json, created_at)

Job(id, source_platform, source_url, url_fingerprint UNIQUE, company, title,
    description_raw, description_clean, requirements_json, location, salary_text,
    scraped_at, status)

AIOutput(id, type ENUM[job_analysis, resume_match, tailoring, cover_letter, proposal],
         input_ref_type, input_ref_id, provider_used, prompt_version, output_json,
         confidence_score, created_at)

Application(id, user_id, job_id, resume_version_id, cover_letter_id NULLABLE,
            proposal_id NULLABLE, status ENUM[queued, generating, ready_for_review,
            submitting, submitted, needs_manual_action, interview, offer, rejected,
            withdrawn], plugin_used, submitted_at, created_at)

CoverLetter(id, application_id, content, tone_preset, created_at)
Proposal(id, application_id, content, platform, created_at)

BrowserSession(id, application_id, plugin_name, status, screenshots_json,
               log_json, retry_count, last_error, started_at, finished_at)

PluginConfiguration(id, workspace_id, plugin_name, enabled, auto_submit_allowed,
                    credentials_encrypted, config_json)

WorkerStatus(id, queue_name, job_id_bullmq, status, attempts, error, updated_at)

AuditLog(id, user_id, action, resource_type, resource_id, metadata_json, created_at)
```

---

## 18. Folder Structure (enterprise monorepo)

```
autoapply/
├── apps/
│   ├── web/                # Next.js 15 frontend
│   ├── api/                 # NestJS API gateway + domain services
│   └── workers/             # BullMQ worker processes (parse, embed, ai, automation)
├── packages/
│   ├── shared/               # Zod schemas, shared TS types, DTOs
│   ├── ai-provider/           # AIProvider interface + Gemini/OpenRouter/Groq adapters
│   ├── storage-provider/      # StorageProvider interface + local/S3 adapters
│   ├── automation/            # JobPlatformPlugin interface + adapter registry
│   └── ui/                     # shared shadcn/ui component library
├── plugins/
│   ├── greenhouse/
│   ├── ashby/
│   ├── guru/
│   └── peopleperhour/
├── infra/
│   ├── docker/                 # Dockerfiles per app
│   ├── nginx/                  # nginx.conf, TLS config
│   └── github-actions/          # CI/CD workflow definitions
├── docker-compose.yml
├── .env.example
└── prisma/
    └── schema.prisma
```
