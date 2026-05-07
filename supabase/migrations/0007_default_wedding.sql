-- Add is_default flag to wedding_members so users can pin a preferred wedding
ALTER TABLE wedding_members
  ADD COLUMN IF NOT EXISTS is_default boolean NOT NULL DEFAULT false;
