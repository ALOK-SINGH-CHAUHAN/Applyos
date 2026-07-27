# 🛠 Tech Stack

ApplyOS is built with a modern, scalable architecture designed for AI-powered workflows, background processing, and browser automation.

## Frontend

The frontend is built with **Next.js 15** using the App Router for fast navigation and server-side rendering.

### Technologies

- **Next.js 15**
- **React 19**
- **TypeScript**
- **Tailwind CSS**
- **Shadcn/UI**
- **TanStack Query**
- **React Hook Form**
- **Zod**
- **Lucide React**

### Why?

- Fast page loads with SSR and Server Components
- Type-safe frontend development
- Modern and responsive UI
- Efficient API caching and state management
- Accessible and reusable components

---

# Backend

The backend is powered by **NestJS**, providing a modular architecture that's easy to maintain and extend.

### Technologies

- NestJS
- TypeScript
- BullMQ
- Redis
- Prisma ORM
- PostgreSQL

### Responsibilities

- Authentication
- Resume Management
- Job Management
- AI Orchestration
- Browser Automation
- Background Workers
- Analytics
- REST APIs

---

# Database

We use **PostgreSQL** as the primary database.

### Stored Data

- Users
- Resumes
- Resume Versions
- Jobs
- Applications
- AI Analysis
- Cover Letters
- Activity Logs
- Analytics

### ORM

- Prisma ORM

Benefits:

- Type-safe queries
- Automatic migrations
- Better developer experience
- Database schema management

---

# AI Layer

ApplyOS uses a provider-agnostic AI orchestration layer instead of depending on a single LLM.

### Current Providers

- Google Gemini
- Groq
- OpenRouter

### Planned Providers

- Cerebras
- NVIDIA NIM
- Mistral AI

### Features

- Automatic provider fallback
- Request timeout handling
- Response validation
- Retry mechanism
- Multi-provider support
- AI abstraction layer

This architecture allows providers to be replaced or added without changing business logic.

---

# Background Processing

Some operations can take several seconds, such as:

- Resume Analysis
- ATS Scoring
- Resume Tailoring
- Cover Letter Generation
- Browser Automation

Instead of blocking the user interface, ApplyOS processes these tasks asynchronously.

### Technologies

- BullMQ
- Redis

Benefits

- Faster UI
- Retry support
- Progress tracking
- Queue management
- Scalable workers

---

# Browser Automation

ApplyOS can automate repetitive job application tasks.

### Technology

- Playwright

Supports platforms such as:

- Greenhouse
- Lever
- Ashby
- Workday
- SmartRecruiters

Future versions will include a plugin system for adding new job platforms.

---

# Authentication

Authentication is handled using Better Auth.

### Features

- Google OAuth
- Session Management
- Protected Routes
- Secure Authentication Flow

---

# File Processing

Supported Formats

- PDF
- DOCX

Capabilities

- Resume Parsing
- Skill Extraction
- Experience Detection
- Education Detection
- Metadata Extraction

---

# AI Workflow

```
Upload Resume
      │
      ▼
Extract Resume Text
      │
      ▼
Resume Intelligence
      │
      ▼
Import Job
      │
      ▼
Job Intelligence
      │
      ▼
Resume Match Analysis
      │
      ▼
Resume Tailoring
      │
      ▼
Cover Letter Generation
      │
      ▼
Browser Automation
      │
      ▼
Application Tracking
```

---

# Project Structure

```
applyos/

├── apps/
│   ├── web/                # Next.js Frontend
│   ├── api/                # NestJS Backend
│   └── workers/            # BullMQ Workers
│
├── packages/
│   ├── ai/                 # AI Provider Abstraction
│   ├── shared/             # Shared Types & Utilities
│   ├── plugins/            # Job Platform Plugins
│   └── ui/                 # Shared UI Components
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
└── docker/
```

---

# Architecture

```
                    User
                      │
                      ▼
               Next.js Frontend
                      │
        ┌─────────────┴─────────────┐
        │                           │
        ▼                           ▼
  Authentication              Dashboard
        │
        ▼
               NestJS Backend
        ┌──────────┼──────────┐
        │          │          │
        ▼          ▼          ▼
 Resume      Jobs Service   AI Service
 Service
        │
        ▼
      BullMQ Queue
        │
        ▼
 Background Workers
        │
        ▼
 AI Provider Orchestrator
        │
 ┌──────┼──────────┬──────────┐
 ▼      ▼          ▼          ▼
Gemini Groq OpenRouter Future Providers
        │
        ▼
 PostgreSQL + Prisma
        │
        ▼
       Redis
```

---

# Design Principles

- Modular Architecture
- Type Safety
- Scalable Services
- Provider Independence
- Background Processing
- Clean Code
- Reusable Components
- Production-Ready APIs
- Extensible Plugin System
- AI-First Development

---

# Why ApplyOS?

Instead of juggling multiple tools for resume editing, ATS optimization, cover letters, and job tracking, ApplyOS brings everything together in one workspace.

The project is designed to simplify the application process by combining AI, automation, and modern web technologies into a single platform that helps job seekers apply faster while keeping every application tailored to the role.
