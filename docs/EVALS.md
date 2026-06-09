# AI Eval Framework — Job Search Copilot

**Author:** Siddharth Jaiswal  
**Date:** June 2026

---

## Overview

The app has two AI-powered features, each with different output shapes and quality criteria:

| Feature | Endpoint | Output type | Primary failure modes |
|---|---|---|---|
| **Fit Scoring** | `POST /api/jobs/[id]/score` | Structured JSON (scores + narratives) | Hallucinated scores, wrong recommendation tier, generic/useless narrative |
| **Application Pack** | `POST /api/jobs/[id]/generate-application-pack` | Structured JSON (8 long-form text assets) | AI-sounding voice, wrong tone, structural violations, ignored writing rules |

Both features call `claude-sonnet-4-6` via the Anthropic Messages API. Both use structured JSON output enforced in the prompt (not via tool use or JSON mode). Both validate output before persisting to Supabase.

---

## Part 1: Fit Scoring Evals

### 1.1 Scoring dimensions and rubric

The scoring system is documented in `src/lib/profile.ts`. Key design choices:

**Weighted composite:**
```
fit_score = seniority × 0.30 + ai × 0.25 + domain × 0.25 + enterprise_saas × 0.10 + location × 0.10
```

Seniority and AI signal carry the most weight because they are the least negotiable for this candidate's search strategy. A perfect-domain role at the wrong seniority level (IC4 PM) should score low. An AI-first role at a consumer company should score medium.

**Recommendation thresholds:**
- Apply: fit_score ≥ 80
- Maybe: 70–79
- Skip: < 70

These thresholds are deliberately conservative. A false positive (recommending Apply on a weak role) wastes hours. A false negative (recommending Skip on a strong role) is recoverable — the candidate reviews the score and overrides.

### 1.2 Eval test cases

The following test cases can be run manually against the scoring endpoint by creating a job with the described JD and running the score route.

#### Case 1: Strong Apply (expected: 85–95, recommendation: apply)

**Role:** Staff PM, AI Platform — fully remote, enterprise B2B  
**JD signals:** "Building LLM evaluation infrastructure, AI governance tooling, model registry. Working with ML engineers and enterprise customers. Staff-level, directly influencing product roadmap. Remote-first."

| Dimension | Expected range |
|---|---|
| seniority_score | 90–100 |
| ai_score | 90–100 |
| domain_score | 90–100 |
| enterprise_saas_score | 85–100 |
| location_score | 100 |
| fit_score | 90–98 |
| recommendation | apply |

**Pass criteria:** All dimensions within range. `fit_reason` mentions AI governance or eval infrastructure. `positioning_angle` references Siddharth's AI product experience. `risks` is not empty.

---

#### Case 2: Maybe (expected: 70–79, recommendation: maybe)

**Role:** Senior Product Manager, Workflow Automation — hybrid SF  
**JD signals:** "Senior PM (4–7 years experience), building no-code workflow tools for mid-market, hybrid in San Francisco. No explicit AI signal."

| Dimension | Expected range |
|---|---|
| seniority_score | 50–74 |
| ai_score | 40–69 |
| domain_score | 80–95 |
| enterprise_saas_score | 60–79 |
| location_score | 85 |
| fit_score | 68–78 |
| recommendation | maybe |

**Pass criteria:** Domain score high (workflow automation is a target domain), but seniority and AI scores pull composite down. `risks` should mention seniority mismatch. `fit_reason` should name the seniority concern explicitly.

---

#### Case 3: Skip (expected: < 70, recommendation: skip)

**Role:** Product Manager, Mobile Gaming — on-site Los Angeles  
**JD signals:** "PM for casual mobile game features. Consumer B2C. 3–5 years experience. On-site LA."

| Dimension | Expected range |
|---|---|
| seniority_score | 0–49 |
| ai_score | 0–39 |
| domain_score | 0–39 |
| enterprise_saas_score | 0–39 |
| location_score | 30 |
| fit_score | < 40 |
| recommendation | skip |

**Pass criteria:** All sub-scores low. `fit_reason` explicitly names consumer domain and seniority mismatch. Recommendation is `skip`.

---

#### Case 4: Seniority edge case (expected: maybe, not apply)

**Role:** Senior PM, AI Features — remote  
**JD signals:** "Senior PM (5+ years) building AI summarization features on a B2B SaaS platform. AI is a key part of the role."

This is the tricky case: strong AI signal, good domain, but explicitly Senior (not Staff/Principal).

| Dimension | Expected range |
|---|---|
| seniority_score | 50–74 |
| ai_score | 75–90 |
| fit_score | 68–78 |
| recommendation | maybe |

**Pass criteria:** Despite strong AI score, seniority score should suppress composite below 80. `risks` should note seniority ceiling. Should NOT recommend `apply`.

---

#### Case 5: Resume context improves quality (regression test)

Run the same job posting twice:
1. Without a resume uploaded to the `documents` table
2. With a detailed resume uploaded

**Expected:** `positioning_angle` and `resume_angle` in the second run are more specific — they reference actual experience from the resume rather than the generic profile. `fit_reason` may shift by 2–5 points depending on resume-to-JD alignment.

**Pass criteria:** Second run produces more specific narrative fields. Score may shift but recommendation tier should remain the same for strong Apply cases.

---

### 1.3 Structural validation

The `validateScore` function in `src/app/api/jobs/[id]/score/route.ts` enforces:

- All 6 score fields are integers 0–100
- `recommendation` is one of `apply` / `maybe` / `skip`
- All 6 narrative string fields are non-empty

Any response that fails validation is rejected with a 500 error and logged. The job's score fields are not updated.

**What to monitor:**
- JSON parse failures (model returned markdown or prose)
- Score fields out of range (model returned floats or > 100)
- Empty narrative fields (model returned null or empty strings)
- Recommendation outside allowed values

---

### 1.4 Known failure modes and mitigations

| Failure mode | Observed frequency | Mitigation |
|---|---|---|
| Model wraps JSON in ```json``` fences | Occasional | `extractJson()` strips fences before parse |
| Score dimensions don't add up to weighted composite | Rare | Not validated programmatically; visual check during use |
| `fit_reason` is generic ("good match for the role") | Occasional | Prompt instructs "be specific, name signals" — if persistent, add a specificity instruction |
| Recommendation disagrees with score math | Rare | Prompt includes explicit threshold rules; can validate post-parse |
| Resume context ignored in narrative | Rare with good resume | Ensure `CANDIDATE RESUME` section is appended clearly in system prompt |

---

## Part 2: Application Pack Evals

### 2.1 Quality dimensions

Application pack quality is evaluated across four dimensions:

| Dimension | What "good" looks like | What "bad" looks like |
|---|---|---|
| **Voice** | Reads like a senior PM wrote it. Active. Direct. Specific. | Em-dashes, "I am passionate about", passive constructions, AI-ish hedging |
| **Role specificity** | References specific company, role title, or JD signals | Generic content that could apply to any PM role at any company |
| **Structural compliance** | Cover letter: 3 paragraphs, opens with "Dear Hiring Team at [company]," closes with "Regards,\nSiddharth" | Missing sign-off, wrong paragraph count, formal salutations like "To Whom It May Concern" |
| **Seniority signal** | Bullets and cover letter language signal staff-level scope (defines roadmaps, drives cross-functional delivery, works with C-suite) | Language that reads junior ("assisted with", "helped to", "participated in") |

### 2.2 Voice eval rubric (per asset)

Score each asset 1–5:

| Score | Description |
|---|---|
| 5 | Sounds exactly like a senior PM wrote it. Specific, active, confident. No AI tells. Could be sent without editing. |
| 4 | Mostly strong. One or two phrases feel slightly AI-generated but would not raise flags with most recruiters. Minor edit needed. |
| 3 | Passable with editing. Some generic phrasing, but the structure and strategy are right. |
| 2 | Needs significant editing. Multiple AI tells, generic content, or structural violations. |
| 1 | Reject and regenerate. Voice is clearly AI. Content is not specific to this role. Structural rule violations. |

**Target:** Average score ≥ 4 across all 8 assets for a given generation run.

### 2.3 Structural compliance checklist

For every generated application pack, verify:

**Cover letter:**
- [ ] Opens with exactly: `Dear Hiring Team at [Company Name],`
- [ ] Exactly 3 paragraphs
- [ ] Paragraph 1 references something specific about the company or role (not generic)
- [ ] Paragraph 2 maps ≥ 2 specific achievements to ≥ 2 role requirements
- [ ] Paragraph 3 is confident about next steps (not "I hope to hear from you")
- [ ] Closes with: `Regards,\nSiddharth`
- [ ] Does NOT contain any em-dashes (—)
- [ ] Does NOT start any paragraph with "I"

**Resume bullets:**
- [ ] 8–10 bullets
- [ ] Each starts with a strong past-tense action verb (Led, Built, Launched, Designed, Drove...)
- [ ] No bullet starts with "Responsible for" or "Helped with"
- [ ] At least 3 bullets include a specific metric or outcome (plausible if exact unknown)

**LinkedIn messages (recruiter + HM):**
- [ ] Under 150 words
- [ ] Gets to the point by sentence 2
- [ ] No formal salutation ("Dear [Name]")
- [ ] References specific role title

**Referral message:**
- [ ] Under 100 words
- [ ] Casual tone
- [ ] Specific about what is needed (referral, intro, both)

**Application form answers:**
- [ ] 3 Q&A pairs
- [ ] Format: `Q: ...\nA: ...` with blank line between pairs
- [ ] Answers are substantive, not generic

**Portfolio recommendations:**
- [ ] 3–4 items
- [ ] Numbered list
- [ ] Each item names a specific artifact type and explains why it matters for *this role*
- [ ] Includes any portfolio/GitHub/LinkedIn links from the user's profile

### 2.4 Eval test cases

#### Pack Case 1: AI governance role

**Job:** Principal PM, AI Governance — enterprise B2B, remote  
**JD signals:** AI safety frameworks, model risk management, enterprise compliance, cross-functional with legal/security teams

**Expected outputs:**
- Cover letter paragraph 2 should reference at least one of: AI governance, AI evals, compliance, risk management experience
- Resume bullets should lead with AI-relevant achievements
- Portfolio recommendations should suggest: AI product strategy deck, eval framework doc, compliance/governance case study

**Pass criteria:** Voice score ≥ 4. No em-dashes. Paragraph 2 maps to AI governance signals specifically.

---

#### Pack Case 2: Workflow automation role at mid-market SaaS

**Job:** Lead PM, Workflow Automation — hybrid NYC  
**JD signals:** No-code builder, approval workflows, integrations marketplace, mid-market B2B

**Expected outputs:**
- Resume summary leads with workflow automation or process intelligence experience
- Cover letter opening references something specific about the company's automation product (if JD provides enough signal) or the market (no-code workflow space)
- LinkedIn messages should not sound like a template

**Pass criteria:** Content is tailored to workflow automation, not generic PM boilerplate.

---

#### Pack Case 3: Resume mirrors upload structure (regression)

Upload a resume with a specific section order (Summary → Experience → Skills → Education) and a consistent bullet format (verb + context + outcome).

Generate a pack and check:
- `resume_summary` follows the same approximate length and structure as the uploaded summary
- `resume_bullets` use the same verb-context-outcome format as the uploaded bullets
- Section count and structure match the uploaded template

**Pass criteria:** Generated content could be copy-pasted into the uploaded resume template without reformatting.

---

### 2.5 Known failure modes and mitigations

| Failure mode | Observed frequency | Mitigation |
|---|---|---|
| Em-dash appears in cover letter | Occasional | Explicit prohibition in system prompt; add a post-generation find/replace as a safety net if needed |
| Cover letter paragraph 1 is generic ("I was excited to see this opportunity") | Occasional | Prompt requires specific company/role reference; may require JD to have enough company signal |
| Resume bullets start with "Responsible for" | Rare | Explicit prohibition in system prompt |
| LinkedIn messages exceed 150 words | Rare | Word count constraint in prompt |
| Portfolio recs are generic ("include a case study") | Occasional | Prompt instructs tying each rec to specific role priorities; ensure JD has enough signal |
| Sign-off missing from cover letter | Rare | Explicit instruction in prompt; enforce in validation or UI display |

---

## Part 3: Prompt Engineering Notes

### Scoring system prompt (`src/lib/profile.ts`)

The prompt uses a negative-constraint design: it is more explicit about what to penalize than what to reward. This reduces hallucinated high scores on domain-mismatched roles.

Key design decisions:
- Explicit domain penalty list (consumer, gaming, fintech retail, media) to counteract model bias toward well-known company brands
- Explicit seniority floor (IC4 = hard penalize) to prevent the model from rationalizing a Senior PM role as "close enough"
- Formula provided in the prompt for fit_score calculation so the model can self-check the composite
- "Be strict: only 90+ for near-perfect alignment" — prevents grade inflation

### Application pack system prompt (`src/lib/apppack-prompt.ts`)

The prompt uses a writing-rules-first design: constraints are listed before candidate profile and output format. This prioritizes style adherence.

Key design decisions:
- "Non-negotiable" label on writing rules signals that these override any competing training-data patterns
- Specific prohibited phrases (not just categories) — the model knows exactly what not to write
- Cover letter structure is prescribed at the structural level (3 paragraphs, what each paragraph must do), not just at the tone level
- Resume template instruction: "Do not change the structure — only tailor the content" prevents the model from inventing a new resume format

### Context injection order

For both prompts, context is injected in priority order (most constraining first):
1. Role/persona definition
2. Writing rules / scoring rubric (non-negotiable)
3. Candidate profile (stable)
4. Dynamic context (resume, profile links) — appended at call time
5. Output format requirements

This order reflects how the model weighs instructions: earlier context in a long system prompt tends to be followed more reliably than later context.

---

## Part 4: Monitoring Recommendations

### What to log

Both API routes currently log errors to `console.error`. For production use, consider adding:

- **Per-call latency:** How long does scoring and pack generation take? Pack generation is typically 8–12 seconds; scoring 2–4 seconds.
- **Token usage:** Log `usage.input_tokens` and `usage.output_tokens` from the Anthropic response to track cost per call.
- **Validation failure rate:** Log when `validateScore()` or JSON.parse() throws. Persistent failures indicate prompt drift or model behavior changes.
- **Recommendation distribution:** Track the ratio of apply / maybe / skip recommendations over time. A shift toward "apply" across all jobs suggests the scoring is becoming less strict.

### What to evaluate periodically

Every ~50 scoring runs, manually review a sample of 5–10 scored jobs:
1. Does the recommendation match your intuition about the role?
2. Are the narrative fields specific (not generic)?
3. Does the composite fit_score match the weighted sum of sub-scores? (manual check)

Every ~20 pack generations, review a sample against the structural compliance checklist.

If quality is degrading, check:
- Whether the model version has changed
- Whether the system prompt is being truncated (very large resume inputs can push system prompt near context limits)
- Whether a new category of JD is being encountered that wasn't covered in the rubric
