# VowPlan

A cloud-based wedding planning platform for couples to manage their wedding from one place.

## Features

- **Dashboard** — countdown, budget overview, RSVP summary, upcoming tasks, quick actions
- **Timeline** — wedding prep tasks, filters, one-click completion, default task generation
- **Suppliers** — vendor directory by category, status pipeline, compare vendors
- **Guests & RSVP** — guest list, CSV import, RSVP/meal/dietary tracking
- **Forms** — custom form builder, public RSVP links, response collection
- **Budget** — category tracking, planned vs actual charts, expense management
- **Settings** — edit details, invite members, CSV export, workspace deletion

## Stack

- **Next.js 14** (App Router) + TypeScript
- **Supabase** (Postgres, Auth, Storage) with Row-Level Security
- **Tailwind CSS** + shadcn/ui components
- **React Hook Form** + Zod validation
- **Recharts** for budget visualisations
- **Sonner** for toast notifications
- **Vitest** for unit tests

## Setup

### 1. Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works)

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Find keys at: Supabase dashboard → Settings → API.

### 4. Run database migrations

Via the Supabase SQL editor or CLI:

```bash
# With Supabase CLI (local dev)
npx supabase db reset

# Or run each file manually in the SQL editor:
#   supabase/migrations/0001_init.sql
#   supabase/migrations/0002_policies.sql
```

### 5. Load seed data (optional)

Run `supabase/seed.sql` in the SQL editor after updating the demo user UUID:

```sql
-- In seed.sql, change:
v_user_id uuid := 'a0000000-0000-0000-0000-000000000001';
-- to the UUID of your test user created via Supabase Auth
```

Or create the demo user first:
```bash
npx supabase auth create-user --email demo@vowplan.app --password demo1234
```

### 6. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run typecheck` | TypeScript type check |
| `npm test` | Run Vitest unit tests |
| `npm run lint` | ESLint |

## Project Structure

```
app/
  (auth)/           — Login, signup, forgot password
  (app)/            — Protected app routes
    onboarding/     — Create/select wedding workspace
    [weddingId]/    — Wedding-scoped pages
      dashboard/
      timeline/
      guests/
      suppliers/
      budget/
      forms/
      settings/
  (public)/rsvp/    — Public RSVP form (no auth required)
  api/forms/        — API route for form submissions
components/
  ui/               — shadcn/ui primitives
  *.tsx             — Feature components
lib/
  supabase/         — SSR, browser, admin clients
  actions/          — Server actions (mutations)
  schemas/          — Zod validation schemas
  utils/            — Helpers (cn, format, countdown, csv, seed-tasks)
  types/            — TypeScript database types
supabase/
  migrations/       — SQL schema + RLS policies
  seed.sql          — Demo data
tests/              — Vitest unit tests
```

## Authentication & Security

- Email/password auth via Supabase Auth
- Sessions managed via `@supabase/ssr` cookie helpers
- Every tenant table has RLS — users can only access weddings they belong to
- Service-role key only used server-side (RSVP form submission API)
- Public form pages accessible without login

## Recommended Next Steps

- [ ] Email delivery for invitations and RSVP confirmations (e.g. Resend)
- [ ] Seating plan builder
- [ ] Stripe payment tracking integration
- [ ] Realtime collaboration (Supabase Realtime)
- [ ] Mobile native app (Expo / React Native)
- [ ] Photo gallery
- [ ] Internationalisation (i18n)
- [ ] Calendar integration (Google / Apple)
