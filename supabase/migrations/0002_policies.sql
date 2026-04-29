-- ============================================================
-- VowPlan — Row-Level Security Policies
-- ============================================================

-- Helper function: is the calling user a member of this wedding?
CREATE OR REPLACE FUNCTION is_wedding_member(p_wedding_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM wedding_members
    WHERE wedding_id = p_wedding_id
      AND user_id    = auth.uid()
  );
$$;

-- ── PROFILES ─────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: read own" ON profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "profiles: update own" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- ── WEDDINGS ─────────────────────────────────────────────────
ALTER TABLE weddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "weddings: member read" ON weddings
  FOR SELECT USING (is_wedding_member(id));

CREATE POLICY "weddings: member update" ON weddings
  FOR UPDATE USING (is_wedding_member(id));

CREATE POLICY "weddings: owner delete" ON weddings
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM wedding_members
      WHERE wedding_id = weddings.id
        AND user_id    = auth.uid()
        AND role       = 'owner'
    )
  );

CREATE POLICY "weddings: authenticated insert" ON weddings
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ── WEDDING MEMBERS ──────────────────────────────────────────
ALTER TABLE wedding_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wedding_members: member read" ON wedding_members
  FOR SELECT USING (is_wedding_member(wedding_id));

CREATE POLICY "wedding_members: owner manage" ON wedding_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM wedding_members wm
      WHERE wm.wedding_id = wedding_members.wedding_id
        AND wm.user_id    = auth.uid()
        AND wm.role       = 'owner'
    )
  );

CREATE POLICY "wedding_members: self insert" ON wedding_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- ── TIMELINE TASKS ───────────────────────────────────────────
ALTER TABLE timeline_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "timeline_tasks: member all" ON timeline_tasks
  FOR ALL USING (is_wedding_member(wedding_id));

-- ── VENDORS ──────────────────────────────────────────────────
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vendors: member all" ON vendors
  FOR ALL USING (is_wedding_member(wedding_id));

-- ── GUESTS ───────────────────────────────────────────────────
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "guests: member all" ON guests
  FOR ALL USING (is_wedding_member(wedding_id));

-- ── FORMS ────────────────────────────────────────────────────
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;

-- Members can manage their own forms
CREATE POLICY "forms: member all" ON forms
  FOR ALL USING (is_wedding_member(wedding_id));

-- Anyone (anon) can read active forms by slug (public RSVP page)
CREATE POLICY "forms: public read active" ON forms
  FOR SELECT USING (is_active = true);

-- ── FORM QUESTIONS ───────────────────────────────────────────
ALTER TABLE form_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "form_questions: member all" ON form_questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM forms f
      WHERE f.id = form_questions.form_id
        AND is_wedding_member(f.wedding_id)
    )
  );

CREATE POLICY "form_questions: public read active" ON form_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM forms f
      WHERE f.id = form_questions.form_id
        AND f.is_active = true
    )
  );

-- ── FORM RESPONSES ───────────────────────────────────────────
ALTER TABLE form_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "form_responses: member read" ON form_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM forms f
      WHERE f.id = form_responses.form_id
        AND is_wedding_member(f.wedding_id)
    )
  );

-- Public insert allowed (anonymous guests submitting RSVP)
-- Done via service-role in API route, so anon does not need direct insert.
CREATE POLICY "form_responses: member manage" ON form_responses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM forms f
      WHERE f.id = form_responses.form_id
        AND is_wedding_member(f.wedding_id)
    )
  );

-- ── BUDGET CATEGORIES ────────────────────────────────────────
ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "budget_categories: member all" ON budget_categories
  FOR ALL USING (is_wedding_member(wedding_id));

-- ── EXPENSES ─────────────────────────────────────────────────
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expenses: member all" ON expenses
  FOR ALL USING (is_wedding_member(wedding_id));
