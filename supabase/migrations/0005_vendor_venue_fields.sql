-- Add venue-specific metadata columns to vendors
ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS subcategory      text,
  ADD COLUMN IF NOT EXISTS min_capacity     integer,
  ADD COLUMN IF NOT EXISTS max_capacity     integer,
  ADD COLUMN IF NOT EXISTS price_per_person numeric(12,2),
  ADD COLUMN IF NOT EXISTS rating           numeric(3,1);
