# Portfolio Audit — Job Search Copilot

---

## What's Here

**Working Next.js application** with Supabase backend, real Claude API integration, and full CRUD data model — not a prototype, a functional application.

**Five pages with real AI integration:** job discovery via public APIs (Greenhouse, Lever, Ashby), Claude-powered fit scoring across 6 weighted dimensions, one-click application pack generation (8 assets), pipeline kanban, and a daily digest surface.

**Complete product documentation** — PRD, strategy doc, and AI evaluation framework.

---

## What's Exemplary

**This is a shipped product, not a strategy doc.** The application runs end-to-end with real API integrations. Claude scores jobs. Claude generates application packs. Supabase stores the data. This demonstrates that product strategy translates into working software.

**The AI fit scoring model.** Scoring across 6 weighted dimensions (seniority match, AI signal presence, domain fit, enterprise SaaS experience, location, company stage) with a written rationale and a clear Apply/Maybe/Skip recommendation is a well-designed PM product decision — specific criteria, transparent reasoning, actionable output.

**The application pack design.** Generating 8 distinct assets (resume summary, bullets, cover letter, LinkedIn message, hiring manager note, referral note, form answers, portfolio recommendations) from a single job description and user profile demonstrates practical AI product thinking: what is the right unit of AI output for this workflow?

**The eval framework.** The EVALS.md documents how to measure whether the AI is working — scoring consistency, recommendation quality, output usefulness. Including an eval framework for a personal-use tool demonstrates that AI quality measurement is a product habit, not just an enterprise requirement.

---

## What Would Come Next

**Multi-user support.** The application is self-hosted and personal. Extending it to multi-user with shared target company lists, shared scoring rubrics, and team pipeline tracking would make it a genuine B2B product concept.

**Company research agent.** The current product scores fit between the user and a job description. A company research agent that synthesises investor updates, employee reviews, news coverage, and product direction would add a second AI capability and raise the signal quality of the scoring.

**Outcome feedback loop.** The system scores and recommends. It does not yet learn from outcomes (interview → offer rate by score tier, response rate by application pack variant). Closing this loop would make the scoring model improve over time.

---

## Maturity Rating

| Dimension | Rating |
|---|---|
| Prototype fidelity | Strong (working app) |
| AI integration | Strong |
| Scoring model | Strong |
| Product design | Strong |
| Eval framework | Strong |
| Multi-user architecture | Not built |
| Outcome feedback loop | Not built |

---

*Built as a personal productivity tool. Uses live API integrations with real AI inference.*
