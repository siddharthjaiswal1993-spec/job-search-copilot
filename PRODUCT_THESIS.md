# Product Thesis — Job Search Copilot

---

## The Bet

Job searching is a high-stakes, high-frequency workflow with a known information problem: job seekers have imperfect information about role fit, and the work of generating application materials is repetitive, time-consuming, and largely mechanical.

AI is well-suited to solve the information and generation problems. The bet: a self-hosted application that uses AI to score role fit, explain the reasoning, and generate a complete application pack per role will let job seekers make better apply/pass decisions faster and apply with higher-quality materials when they do.

---

## The Problem

A PM doing a serious job search faces four specific friction points:

1. **Discovery is noisy.** Job postings flow from multiple boards (LinkedIn, Greenhouse, Lever, Ashby) with inconsistent formatting and significant duplication. There is no systematic way to filter for genuine fit without reading each JD carefully.

2. **Fit assessment is manual and biased.** Most people assess fit by gut feel. A structured scoring model across multiple weighted dimensions (seniority match, domain fit, AI signal strength, company stage, location) produces more consistent and less biased fit estimates.

3. **Application generation is repetitive.** Writing a tailored resume summary, cover letter, LinkedIn message, hiring manager note, and referral note for each role is largely templated work that follows a consistent structure. AI handles this well with the right context.

4. **Pipeline tracking is informal.** Most job seekers manage their pipeline in a spreadsheet or worse, in their head. A structured kanban with status tracking, application history, and a daily digest surfaces the right actions at the right time.

---

## Why Self-Hosted

The product is built to run locally with a personal Supabase instance and an Anthropic API key. Self-hosting has three advantages for this use case:

1. **Resume and job application data is sensitive.** Running it locally means the data stays in a personal database, not on a third-party SaaS platform.
2. **Cost control.** API usage can be precisely controlled — each score and generation call uses a known amount of tokens.
3. **Full control over the scoring model.** The fit scoring dimensions and weights can be edited directly in the source. This is a personal productivity tool; it should be configurable.

---

## The Scoring Model as the Core Product Decision

The application pack generation is the most visible feature. But the fit scoring model is the most important product decision.

Six dimensions: seniority match, AI signal presence, domain fit, enterprise SaaS experience, location, and company stage. Each dimension is scored and weighted. The composite produces a fit score and a recommendation (Apply / Maybe / Skip) with a written rationale.

The scoring model is the lever that makes the daily digest useful. High-fit roles (score ≥ 80) that have no application pack generated surface as prioritised actions. This converts a passive job search (checking boards when you remember to) into an active workflow with clear next steps.

---

## The Broader Thesis

Personal productivity software built around a single person's workflow can often be built faster and better by that person than by a company trying to serve many. The combination of Next.js, Supabase, and Claude makes a product like this buildable in days rather than months. The portfolio value is in the design decisions (scoring model, output structure, feedback loop) and the AI integration pattern — not the scale of the infrastructure.
