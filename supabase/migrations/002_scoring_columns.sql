-- Phase 2: AI scoring sub-score columns
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS seniority_score INTEGER CHECK (seniority_score >= 0 AND seniority_score <= 100),
  ADD COLUMN IF NOT EXISTS ai_score INTEGER CHECK (ai_score >= 0 AND ai_score <= 100),
  ADD COLUMN IF NOT EXISTS enterprise_saas_score INTEGER CHECK (enterprise_saas_score >= 0 AND enterprise_saas_score <= 100),
  ADD COLUMN IF NOT EXISTS domain_score INTEGER CHECK (domain_score >= 0 AND domain_score <= 100),
  ADD COLUMN IF NOT EXISTS location_score INTEGER CHECK (location_score >= 0 AND location_score <= 100),
  ADD COLUMN IF NOT EXISTS resume_angle TEXT,
  ADD COLUMN IF NOT EXISTS outreach_angle TEXT;
