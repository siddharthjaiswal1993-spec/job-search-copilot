# Architecture Overview — Job Search Copilot

**Author:** Siddharth Jaiswal  
**Date:** June 2026

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser (Next.js App Router — React Server Components + RSC)   │
│                                                                   │
│   /dashboard  /digest  /jobs  /companies  /profile               │
│        ↕ fetch (server components query Supabase directly)       │
│        ↕ client actions → Route Handlers (API routes)            │
└──────────────────────┬──────────────────────────────────────────┘
                       │
          ┌────────────┴────────────┐
          ↓                         ↓
  ┌───────────────┐         ┌──────────────────┐
  │   Supabase    │         │  Anthropic API    │
  │  (Postgres)   │         │  claude-sonnet    │
  │               │         │  -4-6             │
  │  jobs         │         │                  │
  │  application  │         │  /score          │
  │  _assets      │         │  /generate-      │
  │  documents    │         │  application-    │
  │  target_      │         │  pack            │
  │  companies    │         └──────────────────┘
  │  user_profile │
  └───────────────┘
          ↑
  ┌───────────────────────────────────────┐
  │  External Job Board APIs (read-only)  │
  │                                       │
  │  boards-api.greenhouse.io             │
  │  api.lever.co                         │
  │  jobs.ashbyhq.com (GraphQL)           │
  └───────────────────────────────────────┘
```

---

## Data Model

### Entity Relationship

```
target_companies (1) ──── (N) jobs
                               │
                               ├──── (N) application_assets
                               │
                               └──── scoring fields (inline on jobs)

documents (standalone)
user_profile (standalone, singleton)
```

### Key design decisions

**Scoring fields are inline on `jobs`, not a separate table.** A job has exactly one score run at a time. If you re-score, it overwrites. This keeps queries simple — no joins needed to display a scored job. Trade-off: no scoring history. Acceptable for v1.

**Application assets are a child table of `jobs`.** One row per asset type per job. This allows inline editing without re-generating the full pack, and makes it easy to query "which jobs have a pack, which don't" for the digest.

**Documents table is a generic store.** `document_type + is_default` pattern supports multiple document types (resume, cover letter template) without schema changes. Only one default per type is used by the AI routes.

**`user_profile` is a singleton table.** Single row, upserted on save. No user ID foreign key (single-user tool). Stores external URLs for portfolio, GitHub, LinkedIn.

**`source_ref` unique index on `jobs`.** External job posting IDs (format: `board:id`, e.g. `greenhouse:123456`) are deduplicated at the database level. An `ON CONFLICT DO NOTHING` pattern in the check-jobs route means duplicate imports silently skip rather than error.

---

## Key Flows

### Flow 1: Job Discovery

```
User clicks "Check Jobs" on a target company
    ↓
POST /api/companies/[id]/check-jobs
    ↓
Fetch company record from Supabase
    ↓
discoverJobs(boardType, token, companyName)  [src/lib/job-discovery.ts]
    ├── fetchGreenhouse() | fetchLever() | fetchAshby()
    ├── PM title filter (isPmTitle)
    └── Strip HTML, truncate description to 8000 chars
    ↓
For each discovered job:
    ├── INSERT INTO jobs ... ON CONFLICT (source_ref) DO NOTHING
    └── Count new insertions
    ↓
UPDATE target_companies SET last_checked_at, jobs_found_total
    ↓
Return { newJobs, skipped } to client
```

**Timeout:** 12 seconds per board API call (`fetchWithTimeout`). If the board is slow, the user sees an error toast — the job is not left in a broken state.

---

### Flow 2: AI Fit Scoring

```
User clicks "Score" on a job detail page
    ↓
POST /api/jobs/[id]/score
    ↓
Parallel fetch:
    ├── jobs.select('*').eq('id', id)
    └── documents.select('content').eq('document_type','resume').eq('is_default',true)
    ↓
Validate: job exists, description or requirements is non-empty
    ↓
Build system prompt:
    └── CANDIDATE_PROFILE (from profile.ts)
        + "\n\n## CANDIDATE RESUME\n\n" + resumeDoc.content  (if uploaded)
    ↓
anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: buildJobPrompt(job) }]
})
    ↓
extractJson(rawText)  — strip any ```json fences
    ↓
JSON.parse → validateScore()  — type-check all 12 fields
    ↓
supabase.from('jobs').update(scoreResult).eq('id', id)
    ↓
Return updated job row
```

**Token budget:** `max_tokens: 1024` is sufficient for the 12-field JSON object. The system prompt (profile + resume) is the large input; typical input tokens: 2000–6000 depending on resume length.

---

### Flow 3: Application Pack Generation

```
User clicks "Generate Pack" on /jobs/[id]/application-pack
    ↓
POST /api/jobs/[id]/generate-application-pack
    ↓
Parallel fetch:
    ├── jobs.select('*').eq('id', id)
    ├── documents.select('content').eq('document_type','resume').eq('is_default',true)
    └── user_profile.select('*').single()
    ↓
Validate: job exists
    ↓
Build system prompt:
    └── APPPACK_SYSTEM_PROMPT (from apppack-prompt.ts)
        + resume section (if uploaded)
        + profile links section (if saved)
    ↓
Build user message:
    └── Job metadata (company, title, location, salary)
        + JD and requirements
        + "Generate all 8 assets. Return JSON only."
    ↓
anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: jobPrompt }]
})
    ↓
extractJson(rawText)
    ↓
JSON.parse — validate 8 keys present and non-empty
    ↓
For each of 8 asset types:
    INSERT INTO application_assets (job_id, asset_type, content)
    ON CONFLICT (job_id, asset_type) DO UPDATE SET content, updated_at
    ↓
Return { assets } to client
```

**Token budget:** `max_tokens: 4096` for 8 long-form assets. Typical pack generation: 3000–4000 output tokens. Typical latency: 8–14 seconds.

**Upsert pattern:** On conflict `(job_id, asset_type)`, update replaces content. This means "Regenerate" works cleanly — old assets are overwritten, not duplicated.

---

### Flow 4: Inline Asset Edit

```
User edits text in a PackSection textarea and clicks Save
    ↓
PATCH /api/application-assets/[id]
Body: { content: string }
    ↓
supabase.from('application_assets')
    .update({ content })
    .eq('id', id)
    ↓
Return updated asset row
```

Simple upsert — no AI involved. The asset's `updated_at` reflects manual edits separately from the `jobs.updated_at`.

---

## API Design Principles

**Route handlers are thin.** Business logic lives in `src/lib/` (job discovery, prompt templates, profile). Route handlers handle: request parsing, auth (Supabase client), error formatting, and response shaping.

**Structured AI output, not tool use.** Both AI features use a JSON-in-prompt pattern rather than Claude's tool use / function calling. Reason: the output shape is fixed and well-defined; tool use adds latency and complexity without benefit. The `extractJson` helper handles the one common failure mode (model wrapping output in markdown fences).

**Fail loudly, don't silently degrade.** Validation failures (invalid score fields, missing pack keys) return 500 with an explicit error message rather than persisting partial data. The user sees an error toast and can retry.

**Parallel Supabase fetches where independent.** Both the score and pack routes use `Promise.all()` for the job + resume fetch to minimize latency.

---

## Component Architecture

```
src/
├── app/
│   ├── layout.tsx              — Root layout with Sidebar
│   ├── page.tsx                — Redirect to /dashboard
│   ├── dashboard/page.tsx      — RSC: pipeline stats
│   ├── digest/page.tsx         — RSC: digest signals
│   ├── jobs/
│   │   ├── page.tsx            — RSC: job list data
│   │   ├── JobInboxClient.tsx  — Client: filter state, table rendering
│   │   ├── add/page.tsx        — Client: manual job form
│   │   └── [id]/
│   │       ├── page.tsx        — RSC: job detail data
│   │       ├── ScoreButton.tsx — Client: POST /score, optimistic UI
│   │       ├── StatusUpdater.tsx — Client: PATCH status
│   │       └── application-pack/
│   │           ├── page.tsx    — RSC: load existing assets
│   │           ├── GenerateButton.tsx  — Client: POST generate
│   │           ├── PackSection.tsx     — Client: textarea + save
│   │           ├── QuickCopyCard.tsx   — Client: copy to clipboard
│   │           └── DownloadButton.tsx  — Client: GET /download
│   ├── companies/
│   │   ├── page.tsx            — RSC: companies data
│   │   ├── CompaniesClient.tsx — Client: grouped display
│   │   ├── CheckJobsButton.tsx — Client: POST check-jobs
│   │   ├── DeleteCompanyButton.tsx — Client: DELETE
│   │   └── add/page.tsx        — Client: add company form
│   └── profile/page.tsx        — Client: resume + URL form
├── components/
│   ├── Sidebar.tsx             — Nav with active state
│   ├── ScoreDisplay.tsx        — Score bars + narrative cards
│   └── StatusBadge.tsx         — Color-coded status pill
└── lib/
    ├── types.ts                — All shared types + constants
    ├── profile.ts              — AI scoring system prompt
    ├── apppack-prompt.ts       — AI pack generation system prompt
    ├── job-discovery.ts        — Board API fetchers + PM filter
    ├── docx-generator.ts       — .docx export builder
    ├── utils.ts                — cn() helper
    └── supabase/
        ├── client.ts           — Browser Supabase client
        └── server.ts           — Server Supabase client (RSC + route handlers)
```

**RSC vs. Client split:**
- Pages that only read data → React Server Components (no client bundle)
- Pages with user interactions (forms, buttons, optimistic updates) → Client components
- Where possible, the RSC page fetches data and passes it as props to a named `*Client.tsx` component that handles interactivity

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon public key |
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key for scoring + pack generation |

The `NEXT_PUBLIC_` prefix exposes Supabase variables to the browser client. The Anthropic key is server-only (not prefixed) and is only accessed in route handlers.

---

## Security Considerations

**This tool is intended for local/private use only.** It does not implement authentication or row-level security.

- Do not deploy to a public URL without adding Supabase RLS and a Next.js auth layer (e.g., NextAuth, Supabase Auth).
- The Anthropic API key is in `.env.local` and never exposed to the browser.
- Job board API integrations use only public, unauthenticated endpoints. No credentials are stored.
- No user data leaves the system except to Supabase (your own project) and Anthropic (job descriptions sent for scoring/generation).
