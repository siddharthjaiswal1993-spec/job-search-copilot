# Product Strategy — Job Search Copilot

**Author:** Siddharth Jaiswal  
**Date:** June 2026

---

## 1. Vision

A job search tool that knows who you are, what you're worth, and what to say — so every application is as strong as if you'd spent a full day on it.

---

## 2. The Problem Worth Solving

Senior job searches are not broken because of lack of effort. They are broken because the effort is applied to the wrong things.

A Staff PM candidate spends:
- 60–90 min per application tailoring a resume summary and bullets
- 45–60 min writing a cover letter from scratch
- 20–30 min crafting a LinkedIn cold message that doesn't sound like spam
- 30–60 min tracking down job postings across a dozen careers pages

None of this work is differentiating. The differentiating work — choosing the right roles, crafting the right narrative, identifying positioning angles — is buried under the operational noise.

**The insight:** The two hardest parts of a job search (deciding which roles are worth applying to, and writing materials that land) can both be substantially automated if you start from a rich, honest candidate profile and score against a principled fit rubric. The automation is not "generate generic content" — it is "generate specific content that sounds like the specific human."

---

## 3. Strategic Bets

### Bet 1: Fit signal before effort

The most expensive mistake in a job search is spending 3 hours on an application for a role that was never a match. AI scoring at intake — before a single word is written — eliminates this. The app should tell you to skip a role before you fall in love with the company brand.

**Implementation:** 6-dimension scoring with opinionated domain penalties and seniority floors. Score < 70 = skip without guilt.

### Bet 2: Voice preservation is the hardest problem

Most AI-generated job application content fails not because it is inaccurate, but because it is recognizably AI-generated. Recruiters pattern-match on em-dashes, passive voice, "I am passionate about" openers, and sycophantic tone. The strategic bet is that maintaining a strict voice profile in the system prompt — with explicit anti-patterns and enforced structural rules — produces content that passes the human bar.

**Implementation:** Non-negotiable writing rules in the application pack system prompt. No em-dashes, no "excited to", active voice, bullets with strong verbs. Cover letter structure enforced (3 paragraphs, specific opening, map-to-role middle, confident close).

### Bet 3: Context compounds

A fit score generated with only a job description is a rough guess. A fit score generated with the job description *and* the candidate's actual resume is a useful signal. An application pack generated with the job description, the candidate's resume, and their portfolio links is materially better than one generated without.

**Implementation:** Progressive context injection across phases. Resume added to scoring prompt in Phase 5. Profile links injected into pack generation. Future phases can add interview history, previous application outcomes, etc.

### Bet 4: Watchlist-driven discovery beats reactive search

Checking LinkedIn every day for new PM postings is reactive and noisy. A watchlist of 30–50 carefully selected companies, polled on demand via public job board APIs, is focused and complete within the target set. The signal-to-noise ratio is dramatically higher because the company filter is applied upstream.

**Implementation:** Target companies table with board integrations (Greenhouse, Lever, Ashby), PM title filter, dedup-on-source-ref, and a daily digest surface.

---

## 4. Phase Rationale

### Why Phase 1 first (pipeline)
You cannot evaluate an AI feature without a system of record to evaluate it in context. Manual intake + pipeline tracking established the data model, the UX patterns, and the edit/status flows that every subsequent phase builds on. It also validates that the core concept (a purpose-built PM job search tool) is worth the investment before adding AI complexity.

### Why Phase 2 second (scoring)
Scoring is the highest-leverage AI feature. It answers the most expensive question ("should I bother?") before any effort is spent. It also required building the Anthropic integration, the JSON validation layer, and the structured output patterns that Phase 3 (app pack) would reuse. Building scoring first meant Phase 3 could move faster.

### Why Phase 3 third (application pack)
Once you know a role is worth applying to, you need materials. Application pack generation is the direct payoff for the scoring investment. A job with a 90 fit_score that requires 3 hours to apply to is still a friction point. Phase 3 collapsed that to 15–20 minutes. The voice rules developed here also informed how to think about AI quality — which fed directly into the eval framework.

### Why Phase 4 fourth (discovery)
The discovery phase was a multiplier on Phase 2+3: it increased the volume of roles that could be scored and generated, which meant the scoring and pack generation features got more real-world usage and feedback faster. Discovery also required building the target companies data model and the daily digest, which improved daily workflow hygiene.

### Why Phase 5 fifth (profile)
Profile/resume integration was sequenced last because it required a clean separation between the static candidate profile (hardcoded in `profile.ts`) and the dynamic resume context (uploaded at runtime). This separation was only necessary once the static profile had been tested and its limitations identified. Phase 5 also required the `user_profile` table and the `documents` table pattern to already exist (both seeded in Phase 1).

---

## 5. Positioning and Competitive Landscape

### Head-to-head alternatives

| Tool | Positioning | Why it falls short for this use case |
|---|---|---|
| LinkedIn | Discovery + apply | No fit scoring, generic AI content, no pipeline management |
| Teal | Pipeline + resume | No job board API integrations, AI writing is generic |
| Huntr / Notion templates | Pipeline tracking | Manual only, no AI |
| ChatGPT / Claude.ai | Ad-hoc writing | No candidate profile, no scoring, no pipeline, tab-per-application workflow |
| Otta, Wellfound | Curated discovery | Consumer-grade, no AI scoring against personal rubric |

### Unique position

Job Search Copilot is the only tool that:
1. Scores roles against a *personalized, domain-specific* fit rubric before application
2. Generates application materials that are *tonally specific* to the candidate (not generic AI)
3. Integrates job board APIs for *focused watchlist discovery* (not passive feed scrolling)
4. Connects discovery → scoring → generation → tracking in a single workflow

The trade-off: this is a self-hosted, single-user tool. It requires technical setup. It is not a product for mass distribution. It is a force multiplier for a specific, technically literate job seeker running a focused search.

---

## 6. Key Decisions and Trade-offs

### Decision: Hardcode candidate profile in system prompts, not in a database
**Why:** The profile is stable over the course of a job search. Making it editable adds UI complexity without proportionate value. The system prompt is version-controlled and can be edited directly.  
**Trade-off:** Changing the profile requires a code change. Acceptable for a single-user tool.

### Decision: PM title filter is permissive (20+ patterns)
**Why:** False negatives (missing a legitimate role) are more costly than false positives (importing a non-PM role that gets skipped on scoring).  
**Trade-off:** Occasional non-PM imports. Addressed by the scoring step, which penalizes seniority mismatches.

### Decision: On-demand discovery, not automated polling
**Why:** Job board APIs don't publish rate limits; daily automated polling risks silent bans. More importantly, the user needs to review discovered roles; there is no value in an inbox that fills automatically overnight without context.  
**Trade-off:** Requires intentional "Check Jobs" clicks. Addressed by the daily digest surface that surfaces companies not checked recently.

### Decision: Claude Sonnet over GPT-4 for scoring and generation
**Why:** Claude's instruction-following on structured JSON output and voice constraints is more reliable. The writing quality on cover letters and LinkedIn messages, when given strict voice rules, tends to be more human-sounding.  
**Trade-off:** Vendor lock-in to Anthropic. API key required. If Anthropic's pricing increases substantially, migration to another model would require prompt re-tuning.

### Decision: No auth / RLS in v1
**Why:** Single-user, local deployment. Adding auth adds 2–4 hours of setup complexity with no benefit for a personal tool.  
**Trade-off:** Cannot safely expose to the public internet. This is by design — the tool is not intended for multi-user deployment without adding auth.

---

## 7. Future Phases (not prioritized)

| Phase | Capability | Strategic value |
|---|---|---|
| Phase 6 | Interview prep per job (likely questions, STAR story mapping, company research) | Closes the loop from application to offer |
| Phase 7 | Outcome tracking (response rate by score tier, which pack elements correlate with callbacks) | Closes the feedback loop; improves scoring calibration over time |
| Phase 8 | More board integrations (Workable, Rippling, SmartRecruiters) | Expands watchlist coverage |
| Phase 9 | Generalization (editable candidate profile, multi-user) | Would require auth, RLS, and profile abstraction |
| Phase 10 | Email / calendar integration (parse recruiter emails, log interviews) | Full pipeline automation |
