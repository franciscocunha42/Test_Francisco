# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start Next.js dev server (http://localhost:3000)
npm run typecheck    # tsc --noEmit — run this before every commit
npm run build        # Production build
npm run lint         # ESLint
npm test             # Vitest unit tests (run once)
npm run test:watch   # Vitest in watch mode

# Run a single test file
npx vitest run tests/csv.test.ts
```

## Required environment variables

Copy `.env.example` → `.env.local` and fill in:
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase project API keys
- `SUPABASE_SERVICE_ROLE_KEY` — server-only service role key
- `NEXT_PUBLIC_SITE_URL` — used to build public RSVP share links
- `RESEND_API_KEY` / `RESEND_FROM_EMAIL` — optional, for RSVP invitation emails

Database schema lives in `supabase/migrations/` (run in order: 0001→0004). Seed data in `supabase/seed.sql`.

## Architecture overview

### Two parallel planning worlds

The app has **two distinct route groups** that mirror each other's pages but use completely different data layers:

| Route group | Path | Auth | Data source |
|---|---|---|---|
| `app/(app)/[weddingId]/` | `/:weddingId/dashboard` etc. | Required | Supabase (server components + server actions) |
| `app/(guest)/plan/` | `/plan/dashboard` etc. | None | Zustand store persisted to `localStorage` |

The guest flow is a try-before-signup experience. When the user clicks "Save to cloud", `lib/actions/claim.ts → claimGuestWedding()` bulk-inserts the entire localStorage snapshot into Supabase and redirects to the real app.

### Auth & access control

- `middleware.ts` — only redirects to `/login` for routes not in the public allowlist (`/`, `/plan/*`, `/rsvp/*`, `/api/rsvp/*`, `/login`, `/signup`)
- `lib/auth.ts` — server-side helpers: `requireUser()`, `requireWeddingMember(weddingId)`, `getUserWeddings()`
- **Every server action** calls `requireWeddingMember(weddingId)` first
- `lib/supabase/server.ts` exports two clients:
  - `createClient()` — service-role client (bypasses RLS); used for all data queries in server actions and server components; access control enforced at the application layer
  - `createAuthClient()` — cookie-aware SSR client; used **only** in `lib/auth.ts` to verify the user session

### Server actions pattern

All mutations live in `lib/actions/*.ts` (each file marked `"use server"`). The pattern:
1. `await requireWeddingMember(weddingId)` — auth gate
2. `schema.safeParse(data)` — Zod validation
3. Supabase mutation
4. `revalidatePath(...)` — invalidate affected pages
5. Return `{ ok: true }` or `{ ok: false, error: string }`

Dialog components accept an optional `onSubmit` prop; when omitted they call server actions directly, when provided (guest mode) they call the store instead.

### Guest store (`lib/guest-store/store.ts`)

Zustand store with `persist` middleware, localStorage key `vowplan:guest:v1`. Mirrors the Supabase schema types exactly (same TypeScript interfaces). CRUD actions mirror server-action signatures so dialog `onSubmit` wiring is a one-liner. `exportSnapshot()` returns a `GuestSnapshot` validated by `lib/guest-store/snapshot.ts` before being sent to `claimGuestWedding`.

`lib/guest-store/use-require-auth.tsx` — React context providing `guard(label, callback?)`. Opens `SignupGate` modal; on successful auth runs `claimGuestWedding` then the queued callback.

### Database schema key points

- Multi-tenancy via `wedding_members` join table (`wedding_id`, `user_id`, `role`)
- `budget_categories.actual_amount` is a **denormalised sum** — must be recalculated after every expense mutation via `recalcCategoryActual()` in `lib/actions/budget.ts`
- `guests.table_id` FK → `seating_tables` (nullable, `ON DELETE SET NULL`)
- All child tables have `ON DELETE CASCADE` from `weddings`, enabling clean rollback in `claimGuestWedding`
- Public RSVP form submissions use the admin client (`lib/supabase/admin.ts`) to bypass RLS

### Component conventions

- `components/ui/` — shadcn/ui primitives (do not edit directly)
- Feature components accept guest-mode override props (`onSubmit`, `onDelete`, etc.) so the same dialogs work in both route groups
- `VendorCard` accepts full `Expense[]` + `BudgetCategory[]`; payment status is derived from linked expenses via `lib/utils/vendor-finance.ts`
- Overdue tasks: `task.due_date < today && status !== "completed"` — handled in `TimelineTaskCard` and dashboard pages by comparing ISO date strings lexicographically

### Validation

Zod schemas in `lib/schemas/` are the single source of truth — used by both server actions (server-side validation) and React Hook Form (`zodResolver`) in dialogs. Guest store mutations validate against the same schemas.
