-- Add RSVP config to forms (meal options, allow new guests)
ALTER TABLE forms ADD COLUMN IF NOT EXISTS config_json jsonb DEFAULT '{}';
