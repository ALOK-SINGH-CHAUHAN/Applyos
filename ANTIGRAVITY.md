# ANTIGRAVITY.md — Project Context for AutoApply (applyos)

> Read this before generating any code. This file defines what each cloned reference repo is *for*, and the boundaries for reusing them. Do not merge these repos wholesale — extract specific subsystems only, per the mapping below.

## Project

AutoApply is an AI-powered job application automation platform. Full spec lives in:
- `docs/PRD.md` — product requirements, architecture, DB schema, API design, sprint plan
- `docs/DESIGN.md` — design tokens, component specs, page-level UI requirements

Read both before scaffolding anything. The architecture is queue-driven (BullMQ + Redis), uses an `AIProvider` abstraction (Gemini → OpenRouter → Groq, never called directly from business logic), and a `JobPlatformPlugin` interface for browser automation. These two abstractions are non-negotiable — do not hardcode a provider or a site adapter into shared code.

## Reference repos (cloned locally) and how to use each

### 1. `Next-js-Boilerplate` (ixartz)
**Role:** starting scaffold for `apps/web` only.
- Use for: Next.js 15 App Router structure, TypeScript config, ESLint/Prettier setup, Tailwind config baseline, testing setup (Vitest/Playwright test config if present).
- Do NOT use: its example pages/marketing content, its auth setup (we use Better Auth per PRD, not whatever this boilerplate ships), its database/ORM choice if it has one.
- Action: copy config files (`tsconfig.json`, `eslint.config.js`, `tailwind.config.ts`, CI workflow skeleton) into `apps/web`, then strip example routes/components down to empty. Do not build on top of its sample dashboard.

### 2. `open-resume` (xitanggg)
**Role:** source for resume parsing/rendering logic, referenced by the Resume Service.
- Use for: its resume PDF/DOCX rendering approach, its ATS-safe resume template structure, and — if present — its client-side resume-builder form patterns.
- Do NOT use: its auth, its storage layer, its overall app shell — we only want the *resume rendering/template* subsystem, not the whole app.
- Action: extract the rendering/template logic into `packages/resume-render` (a new package, not a copy of the whole repo). Adapt its data model to match `Resume.parsed_json` schema in `docs/PRD.md` §7 — do not adopt its schema as-is if it conflicts; ours is the source of truth since it must support versioning and grounding validation.

### 3. `stagehand` (browserbase)
**Role:** dependency for the Automation Layer, used inside `packages/automation` adapters for freelance-marketplace sites (Guru, PeoplePerHour) where DOM structure is unstable.
- Use for: its AI-assisted `act()`/`extract()`/`observe()` API on top of Playwright.
- Do NOT use it for stable ATS platforms (Greenhouse, Ashby) — those adapters should use plain Playwright selectors per `docs/PRD.md` §10, since Stagehand's LLM calls cost tokens/time we don't need on stable DOMs.
- Action: install as an npm dependency (`npm install @browserbase/stagehand`), do not vendor the cloned source into the monorepo. Only reference the cloned repo locally for reading its examples/docs while writing the `JobPlatformPlugin` adapters.

### 4. `unstructured` (Unstructured-IO)
**Role:** dependency for the resume-parsing BullMQ worker (`resume-parse` queue).
- Use for: PDF/DOCX → structured text extraction, feeding into the mapping step that produces `Resume.parsed_json`.
- Do NOT use: its full document-processing platform/API server if this repo includes one — we only need the parsing library, invoked inside our own worker, not run as a separate hosted service.
- Action: this is a Python library; since our workers are the natural place for a Python subprocess/microservice if the Node ecosystem's parsing options are insufficient, evaluate whether a lightweight `unstructured`-based Python sidecar service (invoked over HTTP from the Node worker) is cleaner than trying to shell out per-file. Flag this decision back to me before implementing — it affects the Docker Compose service list in `docs/PRD.md` §12.

## Global rules for the agent

1. **Never call an LLM SDK directly from a service/controller.** All AI calls go through `packages/ai-provider`'s `AIProvider` interface, per PRD §6.2.
2. **Never run browser automation inside an API request.** It's always enqueued via BullMQ and executed in `apps/workers`.
3. **Resume tailoring output must be structured JSON, not freeform text**, and must pass through the Grounding Validator before being marked `ready_for_review` (PRD §6.3). Do not skip this even in early scaffolding — stub it as a pass-through function if needed, but keep the call site in place.
4. **Match design tokens exactly** from `docs/DESIGN.md` when generating any UI component — don't invent new colors, radii, or shadows outside that spec (the two semantic status colors, amber/red, are the only sanctioned additions).
5. **Follow the monorepo folder structure** in PRD §18 (`apps/`, `packages/`, `plugins/`, `infra/`) from the start — don't let boilerplate-repo folder conventions leak in unmodified.
6. **Ask before introducing a new top-level dependency** not already named in the PRD's tech stack (§ Tech Stack) — e.g., don't swap Prisma for another ORM, don't swap BullMQ for another queue.

## Suggested first task for the agent

Scaffold `apps/web` and `apps/api` folder skeletons per PRD §18, wire up the empty `docker-compose.yml` (postgres+pgvector, redis, api, web, workers, nginx stubs), and get `docker compose up` running with health-check endpoints returning `200` on `api` and `workers` — before touching any feature logic. This gives a working baseline to build sprints 1–2 on top of.
