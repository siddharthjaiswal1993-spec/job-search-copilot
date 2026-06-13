# Product Requirements Document — Job Search Copilot

**Owner:** Siddharth Jaiswal  
**Status:** v1.0 — Phases 1–5 shipped  
**Last updated:** June 2026

---

## 1. Problem Statement

Senior PM job searches are operationally intensive. A Staff/Principal-level candidate at any given moment is tracking 20–50 active opportunities across multiple discovery channels, writing tailored application materials for each, and managing a pipeline from first discovery to offer. The existing toolset is a mess: LinkedIn for discovery, a spreadsheet for tracking, Google Docs for cover letters, separate ChatGPT tabs for each tailored output. There is no system of record, no intelligence layer, and no automation. Each application takes 2–4 hours of manual work that could be reduced to 20–30 minutes.

The deeper problem: generic AI writing tools produce generic output. A Senior PM applying for a Staff AI PM role needs materials that signal seniority, domain specificity, and strategic framing — not resume-speak. Off-the-shelf tools do not know the candidate's background, do not score fit before the application, and do not tailor across 8 different application touchpoints.

---

## 2. Target User

**Primary:** Siddharth Jaiswal — AI-native product leader with ~9 years of experience, targeting Staff / Principal / Lead / Group PM roles in AI SaaS, enterprise platform products, agentic workflows, IAM/integrations, and workflow automation.

**Secondary persona (generalizable):** Any senior IC job-seeker conducting a focused search in a specific domain who needs structured pipeline management + AI-assisted application generation tuned to their specific background.

**Key user characteristics:**
- Technically literate; comfortable self-hosting a Next.js + Supabase app
- Has a clear targeting thesis (domains, seniority bands, company types)
- Applies selectively (quality over volume)
- Needs materials that sound like them, not like a generic AI

---

## 3. Goals and Success Metrics

### Product goals

| Goal | Metric | Target |
|---|---|---|
| Reduce time-to-application | Minutes per application (from JD discovery to pack ready) | < 30 min vs. 2–4 hr baseline |
| Improve application quality | Subjective: materials pass the "sounds like me" test | ≥ 80% of generated assets used with minor edits |
| Focus effort on right roles | % of applied roles with fit_score ≥ 80 | ≥ 70% |
| No missed opportunities | New PM roles from watchlist companies discovered within 24h | 100% (on-demand Check Jobs) |
| Pipeline visibility | Time to locate any job's current status | < 10 seconds |

### Anti-goals

- Do not auto-apply. Every application is intentional.
- Do not scrape LinkedIn or any source that prohibits it.
- Do not optimize for volume. This tool is for a focused, high-quality search.

---

## 4. User Stories

### Discovery

- As a user, I want to add a target company and have it auto-pull PM job postings from their public job board so I don't have to check each careers page manually.
- As a user, I want discovered jobs filtered to PM-relevant titles so I don't have to manually scan engineering / design postings.
- As a user, I want deduplication so the same job doesn't appear twice if I check a company multiple times.
- As a user, I want a daily digest view so I can see what's new and what needs attention in one place.

### AI Scoring

- As a user, I want a single fit score (0–100) for each job so I can prioritize quickly without reading every JD.
- As a user, I want to see sub-scores (seniority, AI signal, domain, enterprise SaaS, location) so I understand *why* a role scored the way it did.
- As a user, I want a clear recommendation (Apply / Maybe / Skip) with a written rationale so I can make apply / no-apply decisions in seconds.
- As a user, I want the scoring to account for my actual resume, not just a static profile, so scores improve as I update my resume in the app.
- As a user, I want positioning angle and risk flags per job so I know how to frame myself and what to watch for in the interview process.

### Application Pack Generation

- As a user, I want to generate a complete application pack (resume summary, bullets, cover letter, LinkedIn messages, referral note, form answers, portfolio recs) in one click so I can apply in under 30 minutes.
- As a user, I want the generated cover letter to sound like I wrote it — not passive, not sycophantic, not AI-ish — so it doesn't get filtered by a savvy recruiter.
- As a user, I want to inline-edit any generated asset so I can refine it without leaving the app.
- As a user, I want to copy any asset to clipboard instantly and download the full pack as a .docx so I can use it across different application portals.
- As a user, I want the resume bullets to mirror the structure of my actual resume so generated content plugs in with minimal reformatting.

### Pipeline Management

- As a user, I want to move a job through statuses (Saved → Applied → Screening → Interviewing → Offered / Rejected / Archived) so I have a clear view of where everything stands.
- As a user, I want a dashboard summary of my pipeline so I can see at a glance how many roles are in each stage and what my overall funnel looks like.
- As a user, I want to filter my job inbox by status, recommendation, and fit score so I can surface the roles that need attention right now.

### Profile

- As a user, I want to paste my full resume into the app so that scoring and application generation use my actual experience and not a generic profile.
- As a user, I want to save my portfolio, GitHub, and LinkedIn URLs so they're automatically included in generated application packs.
- As a user, I want to save a default cover letter template that the AI can use as a stylistic reference.

---

## 5. Feature Requirements

### Phase 1 — Job Intake and Pipeline (complete)

| Requirement | Priority |
|---|---|
| Manual job creation form (company, title, location, URL, JD, requirements, salary) | P0 |
| Job status tracking (7 stages) | P0 |
| Job inbox with status filter | P0 |
| Job detail page with full JD | P0 |
| Dashboard with pipeline summary | P0 |
| Auto-updated `updated_at` timestamps | P1 |

### Phase 2 — AI Fit Scoring (complete)

| Requirement | Priority |
|---|---|
| `POST /api/jobs/[id]/score` endpoint | P0 |
| 6-dimension scoring (composite + 5 sub-scores) | P0 |
| Recommendation (apply / maybe / skip) | P0 |
| Narrative fields: fit_reason, positioning_angle, risks, resume_angle, outreach_angle | P0 |
| Score display with color-coded bars on job detail | P0 |
| Job inbox filters: recommendation, fit ≥ 80 | P1 |
| Jobs sorted by fit_score desc | P1 |
| Score uses uploaded resume for context (if available) | P1 |

### Phase 3 — Application Pack (complete)

| Requirement | Priority |
|---|---|
| `POST /api/jobs/[id]/generate-application-pack` endpoint | P0 |
| 8 asset types (see types list in README) | P0 |
| Inline edit and save per asset | P0 |
| Copy-to-clipboard per asset | P0 |
| Download full pack as .docx | P1 |
| Cover letter always opens "Dear Hiring Team at [company]," | P0 |
| Cover letter always closes "Regards, Siddharth" | P0 |
| Resume generation mirrors uploaded resume structure | P1 |
| Portfolio recs include user's saved portfolio/GitHub/LinkedIn links | P1 |

### Phase 4 — Job Discovery (complete)

| Requirement | Priority |
|---|---|
| Target companies table with priority tiers (High / Medium / Low) | P0 |
| Job board integrations: Greenhouse, Lever, Ashby | P0 |
| PM title filter (20+ pattern variants) | P0 |
| Deduplication by `source_ref` unique index | P0 |
| `POST /api/companies/[id]/check-jobs` — pull and import new PM roles | P0 |
| `last_checked_at` and `jobs_found_total` tracking per company | P1 |
| Companies page grouped by priority with collapsible sections | P1 |
| Daily Digest page (new 24h, high-fit, pack gaps, suggested actions) | P1 |

### Phase 5 — Profile (complete)

| Requirement | Priority |
|---|---|
| Profile page at `/profile` | P0 |
| Resume paste (stored in `documents` table, `is_default: true`) | P0 |
| Default cover letter storage | P1 |
| Portfolio, GitHub, LinkedIn URL storage (`user_profile` table) | P0 |
| Resume injected into scoring prompt for richer fit context | P0 |
| Profile links injected into application pack prompt | P1 |
| `GET/PUT /api/profile` | P0 |

---

## 6. Out of Scope

- **No auto-apply.** Every submission is manual and intentional.
- **No LinkedIn scraping.** Against ToS; not needed given job board integrations.
- **No team / multi-user features.** Single-user, self-hosted tool.
- **No email integration.** Outreach is copy-paste from the app.
- **No interview prep.** Out of scope for v1; could be Phase 6.
- **No ATS integrations** (Workday, Taleo, etc.). They do not expose public APIs.
- **No mobile app.** Desktop-first.

---

## 7. Constraints

- **Single-user architecture.** No auth layer; Supabase RLS not configured. Do not expose to public internet.
- **AI cost.** Each scoring call (~$0.003) and pack generation call (~$0.02) costs real money. One-click, not automatic.
- **No job board write access.** All integrations are read-only public APIs.
- **Rate limits.** Greenhouse, Lever, and Ashby do not publish rate limits for their public job board APIs. Calls are on-demand only, not polling.

---

## 8. Acceptance Criteria

A release is complete when:

1. Every P0 requirement in the phase is implemented and navigable via the UI.
2. AI scoring and pack generation return valid, structured responses for a sample PM job posting.
3. No console errors on dashboard, inbox, job detail, or pack pages with a populated database.
4. Migrations run cleanly in order on a fresh Supabase project.
5. `.env.local` with valid keys is the only setup step beyond `npm install`.
