USE career_compass;

ALTER TABLE quiz_variants
  ADD COLUMN IF NOT EXISTS ai_provider VARCHAR(30) NULL COMMENT 'google, grok, openai',
  ADD COLUMN IF NOT EXISTS ai_model VARCHAR(120) NULL,
  ADD COLUMN IF NOT EXISTS ai_raw_response LONGTEXT NULL COMMENT 'raw model JSON/text response';0