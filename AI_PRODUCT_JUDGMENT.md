# AI Product Judgment — Job Search Copilot

---

## Decision 1: Fit scoring is multi-dimensional with a written rationale

**What:** AI fit scoring uses 6 weighted dimensions (seniority match, AI signal presence, domain fit, enterprise SaaS experience, location, company stage) and includes a written rationale alongside the score and recommendation.

**Why:** A fit score without explanation is a black box. A score of 74 tells the user nothing about whether they should adjust their target criteria, look at this role more carefully, or skip it entirely. A score of 74 with a breakdown ("strong on domain fit and AI signal, weak on seniority match and location") and a written rationale ("strong product leadership mandate but title is mid-level IC; remote-eligible if negotiated") gives enough context to make a decision.

The written rationale is the most expensive part of the output (it uses the most tokens) and also the most valuable. It is not optional.

**What this reflects:** AI recommendations in professional contexts should be interpretable — the user should be able to verify the reasoning and decide whether they agree. A recommendation without reasoning transfers the AI's judgment to the user without giving them the basis to evaluate it.

---

## Decision 2: Application pack generates all assets in one pass

**What:** The application pack generates all 8 assets (resume summary, bullets, cover letter, LinkedIn message, hiring manager note, referral note, form answers, portfolio recommendations) in a single API call with a shared context.

**Why:** Generating each asset independently would produce inconsistent outputs — a cover letter that emphasises different skills than the LinkedIn message, or a resume summary that uses different keywords than the referral note. A single context window means all assets share the same framing of the user's background and the role's requirements.

There is also a practical reason: batch generation takes roughly the same time as generating one asset because the latency is dominated by inference speed, not output length. Generating 8 assets at once is more efficient.

**What this reflects:** AI output design should consider consistency across outputs in the same session. When multiple related outputs are generated for the same purpose, they should read as a coherent package — because the user is presenting them to the same audience.

---

## Decision 3: Self-hosted over SaaS

**What:** The application is designed to run locally on a personal Supabase instance, not as a hosted SaaS product.

**Why:** Job application data is sensitive: resume content, cover letters, personal positioning, target companies, salary expectations. This data should not live on a third-party SaaS platform by default. Self-hosting means the data lives in a personal database that the user fully controls.

There is also a product design benefit: full configurability. The scoring weights, prompt templates, and output formats are source-editable. A SaaS product with a fixed scoring model cannot be adjusted to match the user's actual priorities.

**What this reflects:** Deployment model is a product design decision, not just an infrastructure decision. For personal productivity tools with sensitive data, self-hosting is often the correct default — not because SaaS is bad, but because the user's data should be under the user's control.

---

## Decision 4: Eval framework for a personal tool

**What:** EVALS.md documents how to measure whether the AI components are working: scoring consistency, recommendation accuracy, output usefulness, and calibration over time.

**Why:** The eval framework is not required for a personal productivity tool. But including it demonstrates that AI quality measurement is a product habit — something that applies at any scale, not just when a large user base requires it.

More practically: without an eval framework, it is not clear when the scoring model has drifted or when a prompt change has improved or degraded output quality. The eval framework creates accountability for the AI components even in a single-user context.

**What this reflects:** Evaluation is a product discipline, not a scale requirement. Any product with AI components should define how those components are measured. The fact that the user base is one person does not change the fact that the AI should be measurably getting better over time.
