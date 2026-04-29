-- ============================================================
-- VowPlan — Initial Schema
-- ============================================================

-- ENUMS -------------------------------------------------------

CREATE TYPE member_role AS ENUM ('owner', 'partner', 'planner', 'viewer');
CREATE TYPE task_status AS ENUM ('not_started', 'in_progress', 'completed');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE vendor_category AS ENUM (
  'venue', 'catering', 'dj', 'music', 'photography', 'videography',
  'flowers', 'cake', 'transport', 'makeup', 'dress', 'suit',
  'stationery', 'other'
);
CREATE TYPE vendor_status AS ENUM (
  'researching', 'contacted', 'shortlisted', 'booked', 'rejected'
);
CREATE TYPE invitation_status AS ENUM (
  'not_sent', 'sent', 'opened', 'responded'
);
CREATE TYPE rsvp_status AS ENUM ('pending', 'attending', 'not_attending');
CREATE TYPE form_type AS ENUM (
  'rsvp', 'dietary', 'song_request', 'travel', 'custom'
);
CREATE TYPE question_type AS ENUM (
  'text', 'textarea', 'select', 'checkbox', 'radio', 'email', 'phone'
);
CREATE TYPE payment_status AS ENUM (
  'unpaid', 'deposit_paid', 'partially_paid', 'paid'
);

-- PROFILES ----------------------------------------------------

CREATE TABLE IF NOT EXISTS profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   text,
  email       text,
  avatar_url  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Auto-create profile on new auth user
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email)
  ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        email     = EXCLUDED.email;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- WEDDINGS ----------------------------------------------------

CREATE TABLE IF NOT EXISTS weddings (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text NOT NULL,
  partner_one_name text NOT NULL,
  partner_two_name text NOT NULL,
  wedding_date     date,
  venue_name       text,
  location         text,
  total_budget     numeric(12,2) NOT NULL DEFAULT 0,
  currency         text NOT NULL DEFAULT 'USD',
  created_by       uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- WEDDING MEMBERS ---------------------------------------------

CREATE TABLE IF NOT EXISTS wedding_members (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id  uuid NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        member_role NOT NULL DEFAULT 'viewer',
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (wedding_id, user_id)
);

CREATE INDEX idx_wedding_members_wedding ON wedding_members(wedding_id);
CREATE INDEX idx_wedding_members_user    ON wedding_members(user_id);

-- TIMELINE TASKS ----------------------------------------------

CREATE TABLE IF NOT EXISTS timeline_tasks (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id   uuid NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  title        text NOT NULL,
  description  text,
  category     text,
  due_date     date,
  status       task_status NOT NULL DEFAULT 'not_started',
  completed_at timestamptz,
  priority     task_priority NOT NULL DEFAULT 'medium',
  assigned_to  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sort_order   integer NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_timeline_tasks_wedding        ON timeline_tasks(wedding_id);
CREATE INDEX idx_timeline_tasks_wedding_status ON timeline_tasks(wedding_id, status);

-- VENDORS -----------------------------------------------------

CREATE TABLE IF NOT EXISTS vendors (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id        uuid NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  name              text NOT NULL,
  category          vendor_category NOT NULL DEFAULT 'other',
  contact_name      text,
  email             text,
  phone             text,
  website           text,
  quoted_price      numeric(12,2),
  actual_cost       numeric(12,2),
  status            vendor_status NOT NULL DEFAULT 'researching',
  notes             text,
  contract_file_url text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_vendors_wedding        ON vendors(wedding_id);
CREATE INDEX idx_vendors_wedding_status ON vendors(wedding_id, status);
CREATE INDEX idx_vendors_wedding_cat    ON vendors(wedding_id, category);

-- GUESTS ------------------------------------------------------

CREATE TABLE IF NOT EXISTS guests (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id          uuid NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  first_name          text NOT NULL,
  last_name           text NOT NULL,
  email               text,
  phone               text,
  party_name          text,
  invitation_status   invitation_status NOT NULL DEFAULT 'not_sent',
  rsvp_status         rsvp_status NOT NULL DEFAULT 'pending',
  meal_choice         text,
  dietary_requirements text,
  plus_one_allowed    boolean NOT NULL DEFAULT false,
  plus_one_name       text,
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_guests_wedding      ON guests(wedding_id);
CREATE INDEX idx_guests_wedding_rsvp ON guests(wedding_id, rsvp_status);

-- FORMS -------------------------------------------------------

CREATE TABLE IF NOT EXISTS forms (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id  uuid NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  title       text NOT NULL,
  description text,
  type        form_type NOT NULL DEFAULT 'custom',
  public_slug text NOT NULL UNIQUE,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_forms_wedding ON forms(wedding_id);

-- FORM QUESTIONS ----------------------------------------------

CREATE TABLE IF NOT EXISTS form_questions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id       uuid NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  question_type question_type NOT NULL DEFAULT 'text',
  options_json  jsonb,
  required      boolean NOT NULL DEFAULT false,
  sort_order    integer NOT NULL DEFAULT 0
);

CREATE INDEX idx_form_questions_form ON form_questions(form_id);

-- FORM RESPONSES ----------------------------------------------

CREATE TABLE IF NOT EXISTS form_responses (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id      uuid NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  guest_id     uuid REFERENCES guests(id) ON DELETE SET NULL,
  response_json jsonb NOT NULL DEFAULT '{}',
  submitted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_form_responses_form  ON form_responses(form_id);
CREATE INDEX idx_form_responses_guest ON form_responses(guest_id);

-- BUDGET CATEGORIES -------------------------------------------

CREATE TABLE IF NOT EXISTS budget_categories (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id     uuid NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  name           text NOT NULL,
  planned_amount numeric(12,2) NOT NULL DEFAULT 0,
  actual_amount  numeric(12,2) NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_budget_categories_wedding ON budget_categories(wedding_id);

-- EXPENSES ----------------------------------------------------

CREATE TABLE IF NOT EXISTS expenses (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id     uuid NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  category_id    uuid REFERENCES budget_categories(id) ON DELETE SET NULL,
  vendor_id      uuid REFERENCES vendors(id) ON DELETE SET NULL,
  title          text NOT NULL,
  planned_amount numeric(12,2) NOT NULL DEFAULT 0,
  actual_amount  numeric(12,2) NOT NULL DEFAULT 0,
  payment_status payment_status NOT NULL DEFAULT 'unpaid',
  due_date       date,
  paid_date      date,
  notes          text,
  receipt_file_url text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_expenses_wedding  ON expenses(wedding_id);
CREATE INDEX idx_expenses_category ON expenses(category_id);
CREATE INDEX idx_expenses_vendor   ON expenses(vendor_id);
