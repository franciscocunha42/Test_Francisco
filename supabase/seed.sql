-- ============================================================
-- VowPlan — Demo Seed Data
-- Wedding: "Avery & Jordan" (date = CURRENT_DATE + 200 days)
-- Demo user is created via Supabase Auth; here we only insert
-- app data.  Replace DEMO_USER_ID with the auth.users uuid of
-- your test user (or run after signing up once).
-- ============================================================

-- If running against a fresh local Supabase you can create the
-- demo user first with:
--   supabase auth create-user --email demo@vowplan.app --password demo1234
-- then paste the returned id below.

DO $$
DECLARE
  v_user_id       uuid := 'a0000000-0000-0000-0000-000000000001';
  v_wedding_id    uuid := 'b0000000-0000-0000-0000-000000000001';
  v_wedding_date  date := CURRENT_DATE + INTERVAL '200 days';

  -- vendor ids
  v_venue_id      uuid := gen_random_uuid();
  v_photo_id      uuid := gen_random_uuid();
  v_catering_id   uuid := gen_random_uuid();
  v_dj_id         uuid := gen_random_uuid();
  v_flowers_id    uuid := gen_random_uuid();
  v_makeup_id     uuid := gen_random_uuid();

  -- budget category ids
  v_cat_venue     uuid := gen_random_uuid();
  v_cat_food      uuid := gen_random_uuid();
  v_cat_photo     uuid := gen_random_uuid();
  v_cat_decor     uuid := gen_random_uuid();
  v_cat_music     uuid := gen_random_uuid();
  v_cat_beauty    uuid := gen_random_uuid();

  -- form id
  v_form_id       uuid := gen_random_uuid();
BEGIN

  -- ── Profile ───────────────────────────────────────────────
  INSERT INTO profiles (id, full_name, email)
  VALUES (v_user_id, 'Avery Chen', 'demo@vowplan.app')
  ON CONFLICT (id) DO NOTHING;

  -- ── Wedding ───────────────────────────────────────────────
  INSERT INTO weddings (id, name, partner_one_name, partner_two_name,
                        wedding_date, venue_name, location,
                        total_budget, currency, created_by)
  VALUES (v_wedding_id,
          'Avery & Jordan''s Wedding',
          'Avery Chen',
          'Jordan Patel',
          v_wedding_date,
          'The Grand Willow Estate',
          'Napa Valley, CA',
          45000, 'USD',
          v_user_id)
  ON CONFLICT (id) DO NOTHING;

  -- ── Wedding Member ────────────────────────────────────────
  INSERT INTO wedding_members (wedding_id, user_id, role)
  VALUES (v_wedding_id, v_user_id, 'owner')
  ON CONFLICT (wedding_id, user_id) DO NOTHING;

  -- ── Timeline Tasks ────────────────────────────────────────
  INSERT INTO timeline_tasks (wedding_id, title, category, due_date, status, priority, sort_order)
  VALUES
    (v_wedding_id, 'Set wedding budget',           'planning',      v_wedding_date - 180, 'completed', 'high',   1),
    (v_wedding_id, 'Choose and book venue',         'venue',         v_wedding_date - 160, 'completed', 'high',   2),
    (v_wedding_id, 'Hire wedding photographer',     'photography',   v_wedding_date - 150, 'completed', 'high',   3),
    (v_wedding_id, 'Book DJ / live music',          'entertainment', v_wedding_date - 140, 'in_progress','high',  4),
    (v_wedding_id, 'Choose catering',               'catering',      v_wedding_date - 130, 'in_progress','high',  5),
    (v_wedding_id, 'Send save-the-dates',           'guests',        v_wedding_date - 120, 'not_started','medium',6),
    (v_wedding_id, 'Book florist / decorations',    'decor',         v_wedding_date - 110, 'not_started','medium',7),
    (v_wedding_id, 'Order wedding cake',            'catering',      v_wedding_date - 100, 'not_started','medium',8),
    (v_wedding_id, 'Send formal invitations',       'guests',        v_wedding_date - 90,  'not_started','high',  9),
    (v_wedding_id, 'Confirm guest list & headcount','guests',        v_wedding_date - 60,  'not_started','high',  10),
    (v_wedding_id, 'Final dress / suit fitting',    'attire',        v_wedding_date - 30,  'not_started','high',  11),
    (v_wedding_id, 'Confirm supplier arrival times','logistics',     v_wedding_date - 14,  'not_started','high',  12),
    (v_wedding_id, 'Finalize seating plan',         'guests',        v_wedding_date - 10,  'not_started','medium',13),
    (v_wedding_id, 'Prepare ceremony script / vows','ceremony',      v_wedding_date - 21,  'not_started','medium',14);

  -- ── Vendors ───────────────────────────────────────────────
  INSERT INTO vendors (id, wedding_id, name, category, contact_name, email, phone, quoted_price, actual_cost, status, notes)
  VALUES
    (v_venue_id,    v_wedding_id, 'The Grand Willow Estate', 'venue',       'Margaret Hill',  'bookings@grandwillow.com', '707-555-0101', 12000, 12500, 'booked',       'Ceremony + reception hall. Deposit paid.'),
    (v_photo_id,    v_wedding_id, 'Luminary Photo Co.',      'photography', 'Daniel Kim',     'daniel@luminaryphoto.com', '415-555-0202', 4500,  NULL,   'booked',       '8hr package + engagement shoot. Contract signed.'),
    (v_catering_id, v_wedding_id, 'Harvest Table Catering',  'catering',    'Sofia Rossi',    'sofia@harvesttable.com',   '707-555-0303', 9800,  NULL,   'shortlisted',  'Per-head pricing. Awaiting final headcount.'),
    (v_dj_id,       v_wedding_id, 'DJ Solstice',             'dj',          'Marcus Webb',    'marcus@djsolstice.com',    '510-555-0404', 2200,  NULL,   'contacted',    'Sent inquiry. Awaiting quote.'),
    (v_flowers_id,  v_wedding_id, 'Bloom & Wild Florals',    'flowers',     'Clara Nguyen',   'clara@bloomwild.com',      '707-555-0505', 3200,  NULL,   'shortlisted',  'Boho style. Sample arrangement scheduled.'),
    (v_makeup_id,   v_wedding_id, 'Studio Luxe Beauty',      'makeup',      'Priya Kapoor',   'priya@studioluxe.com',     '415-555-0606', 1800,  NULL,   'researching',  'Checking availability.');

  -- ── Guests ────────────────────────────────────────────────
  INSERT INTO guests (wedding_id, first_name, last_name, email, party_name,
                      invitation_status, rsvp_status, meal_choice,
                      dietary_requirements, plus_one_allowed, plus_one_name)
  VALUES
    (v_wedding_id, 'Michael',  'Chen',     'michael.chen@example.com',    'Chen Family',    'sent', 'attending',     'chicken', NULL,          false, NULL),
    (v_wedding_id, 'Linda',    'Chen',     'linda.chen@example.com',      'Chen Family',    'sent', 'attending',     'fish',    NULL,          false, NULL),
    (v_wedding_id, 'Ravi',     'Patel',    'ravi.patel@example.com',      'Patel Family',   'sent', 'attending',     'vegan',   'Vegan',       true,  'Mia Patel'),
    (v_wedding_id, 'Sunita',   'Patel',    'sunita.patel@example.com',    'Patel Family',   'sent', 'attending',     'chicken', NULL,          false, NULL),
    (v_wedding_id, 'James',    'Okafor',   'james.okafor@example.com',    'College Friends','sent', 'attending',     'beef',    'Nut allergy', true,  'Sam Okafor'),
    (v_wedding_id, 'Aisha',    'Thompson', 'aisha.thompson@example.com',  'College Friends','sent', 'not_attending', NULL,      NULL,          false, NULL),
    (v_wedding_id, 'Carlos',   'Mendez',   'carlos.mendez@example.com',   'Work Friends',   'sent', 'pending',       NULL,      NULL,          true,  NULL),
    (v_wedding_id, 'Emily',    'Park',     'emily.park@example.com',      'Work Friends',   'sent', 'pending',       NULL,      NULL,          false, NULL);

  -- ── Budget Categories ─────────────────────────────────────
  INSERT INTO budget_categories (id, wedding_id, name, planned_amount, actual_amount)
  VALUES
    (v_cat_venue,  v_wedding_id, 'Venue & Rentals',  12000, 12500),
    (v_cat_food,   v_wedding_id, 'Catering & Cake',   9800,  0),
    (v_cat_photo,  v_wedding_id, 'Photography & Video',4500, 4500),
    (v_cat_decor,  v_wedding_id, 'Flowers & Decor',   3200,  0),
    (v_cat_music,  v_wedding_id, 'Music & Entertainment',2200,0),
    (v_cat_beauty, v_wedding_id, 'Beauty & Attire',   5000,  0);

  -- ── Expenses ──────────────────────────────────────────────
  INSERT INTO expenses (wedding_id, category_id, vendor_id, title,
                        planned_amount, actual_amount, payment_status, due_date)
  VALUES
    (v_wedding_id, v_cat_venue,  v_venue_id,    'Venue deposit',           3000,  3000, 'paid',            v_wedding_date - 180),
    (v_wedding_id, v_cat_venue,  v_venue_id,    'Venue final balance',     9000,  9500, 'deposit_paid',    v_wedding_date - 14),
    (v_wedding_id, v_cat_photo,  v_photo_id,    'Photography package',     4500,  4500, 'partially_paid',  v_wedding_date - 30),
    (v_wedding_id, v_cat_food,   v_catering_id, 'Catering (est. 80 pax)', 9800,  0,    'unpaid',          v_wedding_date - 60),
    (v_wedding_id, v_cat_music,  v_dj_id,       'DJ package',              2200,  0,    'unpaid',          v_wedding_date - 30),
    (v_wedding_id, v_cat_decor,  v_flowers_id,  'Florals & centrepieces',  3200,  0,    'unpaid',          v_wedding_date - 45),
    (v_wedding_id, v_cat_beauty, v_makeup_id,   'Hair & makeup (2 people)',1800,  0,    'unpaid',          v_wedding_date - 7),
    (v_wedding_id, v_cat_beauty, NULL,           'Wedding attire',          3200,  0,    'unpaid',          v_wedding_date - 60);

  -- ── RSVP Form ─────────────────────────────────────────────
  INSERT INTO forms (id, wedding_id, title, description, type, public_slug, is_active)
  VALUES (v_form_id, v_wedding_id,
          'Avery & Jordan — RSVP',
          'Please let us know if you can make it! We can''t wait to celebrate with you.',
          'rsvp', 'avery-jordan-rsvp', true);

  INSERT INTO form_questions (form_id, question_text, question_type, required, sort_order)
  VALUES
    (v_form_id, 'Your full name',                               'text',     true,  1),
    (v_form_id, 'Your email address',                           'email',    true,  2),
    (v_form_id, 'Will you be attending?',                       'radio',    true,  3),
    (v_form_id, 'Plus-one name (if applicable)',                'text',     false, 4),
    (v_form_id, 'Meal choice',                                  'select',   true,  5),
    (v_form_id, 'Any dietary requirements or allergies?',       'textarea', false, 6),
    (v_form_id, 'Song request — we''ll try to play it!',        'text',     false, 7),
    (v_form_id, 'A message for the couple',                     'textarea', false, 8);

  -- Set options for radio / select questions
  UPDATE form_questions
    SET options_json = '["Yes, I''ll be there!", "Sorry, I can''t make it"]'::jsonb
    WHERE form_id = v_form_id AND question_text = 'Will you be attending?';

  UPDATE form_questions
    SET options_json = '["Chicken", "Fish", "Vegan / Vegetarian", "Children''s meal"]'::jsonb
    WHERE form_id = v_form_id AND question_text = 'Meal choice';

END $$;
