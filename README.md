# Job Search Copilot

An AI-native job search management tool — covering discovery, AI fit scoring, application pack generation, and pipeline tracking in a single self-hosted app.

> Built by Siddharth Jaiswal. See [`docs/`](./docs/) for the full PRD, product strategy, and AI eval framework.

---

## What it does

| Workflow | Capability |
|---|---|
| **Discover** | Pull PM roles from Greenhouse, Lever, and Ashby public APIs on demand; deduplicate by source ref |
| **Score** | AI fit scoring across 6 weighted dimensions using Claude; recommendation: apply / maybe / skip |
| **Generate** | One-click application pack: resume summary + bullets, cover letter, LinkedIn messages, referral note, form answers, portfolio recs |
| **Track** | Pipeline kanban from Saved → Applied → Screening → Interviewing → Offered / Rejected / Archived |
| **Digest** | Daily digest surface: new jobs in last 24h, high-fit roles (80+), packs not yet generated, suggested actions |

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Database | Supabase (Postgres) |
| UI | Tailwind CSS v4 + shadcn/ui (base-ui) |
| AI | Anthropic Claude `claude-sonnet-4-6` |
| Export | `docx` for Word download |

---

## Setup

### 1. Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. In the **SQL Editor**, run all four migrations in order:

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_scoring_columns.sql
supabase/migrations/003_target_companies.sql
supabase/migrations/004_user_profile.sql
```

3. Copy **Project URL** and **anon public key** from Settings → API.

### 2. Environment variables

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — redirects to `/dashboard`.

---

## Pages

| Route | Description |
|---|---|
| `/dashboard` | Pipeline stats, mini progress bars, recent activity |
| `/digest` | Daily digest — new jobs, high-fit, pack gaps, next actions |
| `/jobs` | Job inbox — filterable by status, recommendation, fit ≥ 80 |
| `/jobs/add` | Add a job manually (URL, description, metadata) |
| `/jobs/[id]` | Job detail — full JD, AI score breakdown, status updater |
| `/jobs/[id]/application-pack` | Generate and inline-edit all 8 application assets |
| `/companies` | Target companies grouped by priority (High / Medium / Low) |
| `/companies/add` | Add company with board type + token |
| `/profile` | Resume paste, default cover letter, portfolio/GitHub/LinkedIn URLs |

---

## Job status flow

```
saved → applied → screening → interviewing → offered
                                           → rejected
                                           → archived
```

---

## AI scoring dimensions

Each dimension is scored 0–100. `fit_score` is a weighted composite.

| Dimension | Weight | What it measures |
|---|---|---|
| `seniority_score` | 30% | Staff / Principal / Lead / Group PM signal vs. mid-level |
| `ai_score` | 25% | AI-first role vs. AI-adjacent vs. traditional SaaS |
| `domain_score` | 25% | Match to target domains (workflow automation, IAM, agentic, AI evals, etc.) |
| `enterprise_saas_score` | 10% | Enterprise B2B signal vs. consumer / SMB |
| `location_score` | 10% | Remote / hybrid / on-site scoring by hub city |

**Recommendation thresholds:** Apply ≥ 80 · Maybe 70–79 · Skip < 70

Beyond the score, each job also gets: `fit_reason`, `positioning_angle`, `risks`, `resume_angle`, `outreach_angle`.

---

## Application pack — 8 asset types

| Asset | Description |
|---|---|
| `resume_summary` | 3–5 sentence positioning statement |
| `resume_bullets` | 8–10 tailored achievement bullets |
| `cover_letter` | Full 3-paragraph letter to Hiring Team |
| `linkedin_recruiter_message` | < 150 words, peer-to-peer |
| `linkedin_hiring_manager_message` | < 150 words, direct |
| `referral_message` | < 100 words, casual, easy to forward |
| `application_form_answers` | 3 common screening Q&As |
| `portfolio_recommendations` | 3–4 artifact suggestions tied to role priorities |

---

## Job board integrations

| Board | API | Token location |
|---|---|---|
| **Greenhouse** | `GET boards-api.greenhouse.io/v1/boards/{token}/jobs?content=true` | `boards.greenhouse.io/{token}` |
| **Lever** | `GET api.lever.co/v0/postings/{token}?mode=json` | `jobs.lever.co/{token}` |
| **Ashby** | `POST jobs.ashbyhq.com/api/non-user-graphql` (GraphQL) | `jobs.ashbyhq.com/{token}` |

All integrations filter by PM title patterns and strip HTML from descriptions. Deduplication uses a `source_ref` unique index (`board:id`).

---

## Database schema

### `jobs`
Core job tracking table. Every discovered or manually-added role lives here.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `company`, `title` | text | Required |
| `location`, `salary_range`, `source_url` | text | Optional |
| `source` | text | `manual`, `greenhouse`, `lever`, `ashby` |
| `source_ref` | text | Unique external ID for deduplication |
| `description`, `requirements` | text | Full JD text |
| `status` | text | Pipeline stage |
| `fit_score` | integer | 0–100 composite |
| `seniority_score`, `ai_score`, `enterprise_saas_score`, `domain_score`, `location_score` | integer | Sub-scores |
| `recommendation` | text | `apply` / `maybe` / `skip` |
| `fit_reason`, `positioning_angle`, `risks`, `resume_angle`, `outreach_angle` | text | AI narrative outputs |

### `application_assets`
One row per asset per job. Content is plain text. Inline editable via `PATCH /api/application-assets/[id]`.

### `documents`
Master resume (`document_type: 'resume'`, `is_default: true`) and default cover letter. Resume is injected into the scoring and application pack prompts as candidate context.

### `target_companies`
Watchlist with board integration config. `jobs_found_total` increments on each successful Check Jobs run.

### `user_profile`
LinkedIn, GitHub, portfolio URLs stored per-user. Injected into application pack prompts.

---

## API routes

| Method + Path | Purpose |
|---|---|
| `POST /api/jobs` | Create job |
| `GET/PATCH/DELETE /api/jobs/[id]` | Job CRUD |
| `POST /api/jobs/[id]/score` | Run AI fit scoring |
| `POST /api/jobs/[id]/generate-application-pack` | Generate all 8 assets |
| `GET /api/jobs/[id]/download` | Download pack as .docx |
| `PATCH /api/application-assets/[id]` | Inline-edit an asset |
| `POST /api/fetch-job` | Auto-fetch JD from URL |
| `GET/POST /api/companies` | List / create target company |
| `PATCH/DELETE /api/companies/[id]` | Update / delete company |
| `POST /api/companies/[id]/check-jobs` | Run job discovery for one company |
| `GET/PUT /api/profile` | Load / save user profile |

---

## Docs

- [Product Requirements Document](./docs/PRD.md)
- [Product Strategy](./docs/STRATEGY.md)
- [AI Eval Framework](./docs/EVALS.md)
- [Architecture Overview](./docs/ARCHITECTURE.md)

---

## What I Built

| Artifact | Description |
|---|---|
| Functional Next.js app | Full-stack implementation — Supabase + Claude API, 9 pages, 11 API routes, job board connectors for Greenhouse, Lever, and Ashby |
| 4 product docs | PRD, product strategy, AI eval framework, and architecture overview in `docs/` |
| Standard portfolio docs | PORTFOLIO_AUDIT, PRODUCT_THESIS, WHAT_I_BUILT, OUTCOME_MODEL, AI_PRODUCT_JUDGMENT |

---

*Built by Siddharth Jaiswal — [linkedin.com/in/sidjais](https://linkedin.com/in/sidjais)*
