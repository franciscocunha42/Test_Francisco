-- Add photo URLs (stored as text array) to vendors
ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS photos text[] NOT NULL DEFAULT '{}';
