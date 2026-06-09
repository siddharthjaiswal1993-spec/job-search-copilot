-- Phase 4: Job Discovery

-- source_ref on jobs for external deduplication
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS source_ref TEXT;

-- Unique index so we never double-import the same external posting
CREATE UNIQUE INDEX IF NOT EXISTS idx_jobs_source_ref
  ON jobs(source_ref)
  WHERE source_ref IS NOT NULL;

-- Target companies table
CREATE TABLE IF NOT EXISTS target_companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  careers_url TEXT,
  job_board_type TEXT NOT NULL DEFAULT 'manual'
    CHECK (job_board_type IN ('greenhouse', 'lever', 'ashby', 'manual')),
  job_board_token TEXT,
  priority TEXT NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('high', 'medium', 'low')),
  notes TEXT,
  last_checked_at TIMESTAMPTZ,
  jobs_found_total INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER target_companies_updated_at
  BEFORE UPDATE ON target_companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_target_companies_priority ON target_companies(priority);
