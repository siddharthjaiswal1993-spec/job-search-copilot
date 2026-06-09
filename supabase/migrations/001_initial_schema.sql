-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company TEXT NOT NULL,
  title TEXT NOT NULL,
  location TEXT,
  source_url TEXT,
  source TEXT DEFAULT 'manual',
  description TEXT,
  requirements TEXT,
  salary_range TEXT,
  status TEXT NOT NULL DEFAULT 'saved' CHECK (
    status IN ('saved', 'applied', 'screening', 'interviewing', 'offered', 'rejected', 'archived')
  ),
  fit_score INTEGER CHECK (fit_score >= 0 AND fit_score <= 100),
  recommendation TEXT,
  fit_reason TEXT,
  positioning_angle TEXT,
  risks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Application assets table (reserved for Phase 2)
CREATE TABLE IF NOT EXISTS application_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL,
  content TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER application_assets_updated_at
  BEFORE UPDATE ON application_assets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Documents table (reserved for Phase 2 — resume, cover letter templates)
CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  document_type TEXT NOT NULL CHECK (
    document_type IN ('resume', 'cover_letter', 'linkedin_summary', 'other')
  ),
  content TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Indexes for common queries
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX idx_application_assets_job_id ON application_assets(job_id);
