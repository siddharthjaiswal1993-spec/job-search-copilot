-- User profile table for storing URLs and metadata
-- Resume and cover letter text are stored in the existing `documents` table
CREATE TABLE IF NOT EXISTS user_profile (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  portfolio_url TEXT,
  github_url TEXT,
  linkedin_url TEXT,
  additional_links TEXT, -- freeform: other relevant URLs
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER user_profile_updated_at
  BEFORE UPDATE ON user_profile
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Seed a single profile row that the app will always upsert into
INSERT INTO user_profile (portfolio_url, github_url, linkedin_url)
VALUES (NULL, NULL, NULL)
ON CONFLICT DO NOTHING;
