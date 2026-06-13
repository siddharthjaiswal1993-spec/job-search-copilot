# What I Built — Job Search Copilot

---

## What Exists

A fully functional Next.js application with Supabase backend and live Claude API integration. This is a working product, not a prototype.

---

## Application Pages

| Route | Page | Description |
|---|---|---|
| `/dashboard` | Pipeline Dashboard | Stats, mini progress bars, recent activity |
| `/digest` | Daily Digest | New jobs in last 24h, high-fit roles (≥80), packs not yet generated, suggested next actions |
| `/jobs` | Job Inbox | Filterable by status, recommendation, fit ≥ 80 |
| `/jobs/add` | Add Job | Manual job entry (URL, description, metadata) |
| `/jobs/[id]` | Job Detail | Full JD, AI score breakdown, status updater |
| `/jobs/[id]/application-pack` | Application Pack | Generate and inline-edit all 8 application assets |
| `/companies` | Target Companies | Grouped by priority (High / Medium / Low) |
| `/profile` | User Profile | Resume, preferences, scoring weights |
| `/settings` | Settings | API config, scoring configuration |

---

## AI Capabilities

**Fit scoring** — Claude scores each job across 6 weighted dimensions with a written rationale and an Apply/Maybe/Skip recommendation.

**Application pack generation** — 8 assets per job: resume summary, resume bullets, cover letter, LinkedIn message, hiring manager note, referral note, form answers, portfolio recommendations.

**Daily digest** — AI-surfaced prioritisation of what to do today based on pipeline state.

---

## Product Documentation

| File | Contents |
|---|---|
| `docs/PRD.md` | Full product requirements, user stories, data model |
| `docs/STRATEGY.md` | Product strategy, AI integration design, roadmap phases |
| `docs/EVALS.md` | AI evaluation framework for scoring quality and output usefulness |

---

## Standard Portfolio Documents

| File | Contents |
|---|---|
| `PORTFOLIO_AUDIT.md` | Honest evaluation of completeness, strengths, and what's missing |
| `PRODUCT_THESIS.md` | The core bet, problem framing, and strategic rationale |
| `WHAT_I_BUILT.md` | This file |
| `OUTCOME_MODEL.md` | How success is measured |
| `AI_PRODUCT_JUDGMENT.md` | AI-specific product decisions and the reasoning behind them |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Database | Supabase (Postgres) |
| UI | Tailwind CSS v4 + shadcn/ui |
| AI | Anthropic Claude `claude-sonnet-4-6` |
| Export | `docx` for Word download |

---

## Key Design Decisions

**Self-hosted by design** — resume and job application data is sensitive. Running locally with a personal Supabase instance means the data never leaves a personal database.

**Scoring model is configurable** — the 6 dimensions and their weights are editable in the source. This is a personal productivity tool; it should be adjustable to the user's actual priorities.

**Application pack as the single AI output unit** — rather than generating assets one at a time, the pack generates all 8 assets in one call with a consistent context. This produces more coherent outputs and reduces API overhead.
