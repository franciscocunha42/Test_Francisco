-- ============================================================
-- VowPlan — Seating Plan
-- ============================================================

CREATE TABLE IF NOT EXISTS seating_tables (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id  uuid NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  name        text NOT NULL,
  capacity    integer NOT NULL DEFAULT 8 CHECK (capacity > 0),
  notes       text,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_seating_tables_wedding ON seating_tables(wedding_id);

-- Add nullable table_id on guests to track which seating table they belong to.
ALTER TABLE guests
  ADD COLUMN IF NOT EXISTS table_id uuid
    REFERENCES seating_tables(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_guests_table ON guests(table_id);

-- RLS policy: members of the wedding can manage seating tables.
ALTER TABLE seating_tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "seating_tables: member all" ON seating_tables
  FOR ALL USING (is_wedding_member(wedding_id));
