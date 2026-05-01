"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { generateDefaultTasks } from "@/lib/utils/seed-tasks";
import type {
  Wedding,
  TimelineTask,
  Vendor,
  Guest,
  BudgetCategory,
  Expense,
} from "@/lib/types/database";

// Default budget categories — kept in sync with lib/actions/wedding.ts
export const DEFAULT_BUDGET_CATEGORIES = [
  "Venue & Rentals",
  "Catering & Cake",
  "Photography & Video",
  "Flowers & Decor",
  "Music & Entertainment",
  "Beauty & Attire",
  "Honeymoon",
];

const SCHEMA_VERSION = 1 as const;

// crypto.randomUUID is available in modern browsers and produces UUIDs
// that pass zod .uuid() validation when the snapshot is migrated.
function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // Fallback for SSR — should not actually run since the store is client-only.
  return "00000000-0000-4000-8000-" + Math.random().toString(36).slice(2, 14).padEnd(12, "0");
}

function nowIso() {
  return new Date().toISOString();
}

export type GuestWedding = Omit<Wedding, "created_by">;
export type GuestTimelineTask = TimelineTask;
export type GuestVendor = Vendor;
export type GuestGuest = Guest;
export type GuestBudgetCategory = BudgetCategory;
export type GuestExpense = Expense;

export interface GuestSnapshot {
  schemaVersion: typeof SCHEMA_VERSION;
  weddingId: string;
  wedding: GuestWedding | null;
  tasks: GuestTimelineTask[];
  vendors: GuestVendor[];
  guests: GuestGuest[];
  budgetCategories: GuestBudgetCategory[];
  expenses: GuestExpense[];
}

interface Actions {
  ensureWedding: (input: {
    name: string;
    partner_one_name: string;
    partner_two_name: string;
    wedding_date?: string | null;
    venue_name?: string | null;
    location?: string | null;
    total_budget?: number;
    currency?: string;
  }) => GuestWedding;
  updateWedding: (patch: Partial<GuestWedding>) => void;

  createTask: (data: Partial<GuestTimelineTask>) => GuestTimelineTask;
  updateTask: (id: string, patch: Partial<GuestTimelineTask>) => void;
  deleteTask: (id: string) => void;
  generateDefaultTasks: () => void;

  createVendor: (data: Partial<GuestVendor>) => GuestVendor;
  updateVendor: (id: string, patch: Partial<GuestVendor>) => void;
  deleteVendor: (id: string) => void;

  createGuest: (data: Partial<GuestGuest>) => GuestGuest;
  updateGuest: (id: string, patch: Partial<GuestGuest>) => void;
  deleteGuest: (id: string) => void;
  bulkImportGuests: (rows: Partial<GuestGuest>[]) => number;

  createBudgetCategory: (data: Partial<GuestBudgetCategory>) => GuestBudgetCategory;
  updateBudgetCategory: (id: string, patch: Partial<GuestBudgetCategory>) => void;
  deleteBudgetCategory: (id: string) => void;

  createExpense: (data: Partial<GuestExpense>) => GuestExpense;
  updateExpense: (id: string, patch: Partial<GuestExpense>) => void;
  deleteExpense: (id: string) => void;

  reset: () => void;
  exportSnapshot: () => GuestSnapshot;
}

type StoreState = GuestSnapshot & Actions;

function emptyState(weddingId: string): GuestSnapshot {
  return {
    schemaVersion: SCHEMA_VERSION,
    weddingId,
    wedding: null,
    tasks: [],
    vendors: [],
    guests: [],
    budgetCategories: [],
    expenses: [],
  };
}

function recalcCategoryActual(state: StoreState, categoryId: string): GuestBudgetCategory[] {
  const total = state.expenses
    .filter((e) => e.category_id === categoryId)
    .reduce((sum, e) => sum + (e.actual_amount ?? 0), 0);
  return state.budgetCategories.map((c) =>
    c.id === categoryId ? { ...c, actual_amount: total } : c
  );
}

export const useGuestStore = create<StoreState>()(
  persist(
    (set, get) => {
      const initialWeddingId = uuid();
      return {
        ...emptyState(initialWeddingId),

        ensureWedding: (input) => {
          const existing = get().wedding;
          if (existing) return existing;
          const weddingId = get().weddingId;
          const wedding: GuestWedding = {
            id: weddingId,
            name: input.name,
            partner_one_name: input.partner_one_name,
            partner_two_name: input.partner_two_name,
            wedding_date: input.wedding_date ?? null,
            venue_name: input.venue_name ?? null,
            location: input.location ?? null,
            total_budget: input.total_budget ?? 0,
            currency: input.currency ?? "USD",
            created_at: nowIso(),
          };
          const defaultCategories: GuestBudgetCategory[] = DEFAULT_BUDGET_CATEGORIES.map((name) => ({
            id: uuid(),
            wedding_id: weddingId,
            name,
            planned_amount: 0,
            actual_amount: 0,
            created_at: nowIso(),
          }));
          set({ wedding, budgetCategories: defaultCategories });
          return wedding;
        },

        updateWedding: (patch) => {
          const w = get().wedding;
          if (!w) return;
          set({ wedding: { ...w, ...patch } });
        },

        createTask: (data) => {
          const task: GuestTimelineTask = {
            id: uuid(),
            wedding_id: get().weddingId,
            title: data.title ?? "Untitled task",
            description: data.description ?? null,
            category: data.category ?? null,
            due_date: data.due_date ?? null,
            status: data.status ?? "not_started",
            completed_at: data.completed_at ?? null,
            priority: data.priority ?? "medium",
            assigned_to: data.assigned_to ?? null,
            sort_order: data.sort_order ?? get().tasks.length + 1,
            created_at: nowIso(),
          };
          set({ tasks: [...get().tasks, task] });
          return task;
        },
        updateTask: (id, patch) => {
          set({
            tasks: get().tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
          });
        },
        deleteTask: (id) => {
          set({ tasks: get().tasks.filter((t) => t.id !== id) });
        },
        generateDefaultTasks: () => {
          const w = get().wedding;
          if (!w?.wedding_date) return;
          const date = new Date(w.wedding_date);
          if (Number.isNaN(date.getTime())) return;
          const generated = generateDefaultTasks(date, get().weddingId);
          const tasks: GuestTimelineTask[] = generated.map((t) => ({
            id: uuid(),
            wedding_id: t.wedding_id,
            title: t.title,
            description: t.description ?? null,
            category: t.category,
            due_date: t.due_date,
            status: t.status,
            completed_at: t.completed_at ?? null,
            priority: t.priority,
            assigned_to: t.assigned_to ?? null,
            sort_order: t.sort_order,
            created_at: nowIso(),
          }));
          set({ tasks: [...get().tasks, ...tasks] });
        },

        createVendor: (data) => {
          const v: GuestVendor = {
            id: uuid(),
            wedding_id: get().weddingId,
            name: data.name ?? "Unnamed vendor",
            category: data.category ?? "other",
            contact_name: data.contact_name ?? null,
            email: data.email ?? null,
            phone: data.phone ?? null,
            website: data.website ?? null,
            quoted_price: data.quoted_price ?? null,
            actual_cost: data.actual_cost ?? null,
            status: data.status ?? "researching",
            notes: data.notes ?? null,
            contract_file_url: data.contract_file_url ?? null,
            created_at: nowIso(),
          };
          set({ vendors: [...get().vendors, v] });
          return v;
        },
        updateVendor: (id, patch) => {
          set({ vendors: get().vendors.map((v) => (v.id === id ? { ...v, ...patch } : v)) });
        },
        deleteVendor: (id) => {
          set({ vendors: get().vendors.filter((v) => v.id !== id) });
        },

        createGuest: (data) => {
          const g: GuestGuest = {
            id: uuid(),
            wedding_id: get().weddingId,
            first_name: data.first_name ?? "Guest",
            last_name: data.last_name ?? "",
            email: data.email ?? null,
            phone: data.phone ?? null,
            party_name: data.party_name ?? null,
            invitation_status: data.invitation_status ?? "not_sent",
            rsvp_status: data.rsvp_status ?? "pending",
            meal_choice: data.meal_choice ?? null,
            dietary_requirements: data.dietary_requirements ?? null,
            plus_one_allowed: data.plus_one_allowed ?? false,
            plus_one_name: data.plus_one_name ?? null,
            notes: data.notes ?? null,
            created_at: nowIso(),
          };
          set({ guests: [...get().guests, g] });
          return g;
        },
        updateGuest: (id, patch) => {
          set({ guests: get().guests.map((g) => (g.id === id ? { ...g, ...patch } : g)) });
        },
        deleteGuest: (id) => {
          set({ guests: get().guests.filter((g) => g.id !== id) });
        },
        bulkImportGuests: (rows) => {
          const weddingId = get().weddingId;
          const newGuests: GuestGuest[] = rows.map((r) => ({
            id: uuid(),
            wedding_id: weddingId,
            first_name: r.first_name ?? "Guest",
            last_name: r.last_name ?? "",
            email: r.email ?? null,
            phone: r.phone ?? null,
            party_name: r.party_name ?? null,
            invitation_status: "not_sent",
            rsvp_status: "pending",
            meal_choice: null,
            dietary_requirements: r.dietary_requirements ?? null,
            plus_one_allowed: r.plus_one_allowed ?? false,
            plus_one_name: null,
            notes: null,
            created_at: nowIso(),
          }));
          set({ guests: [...get().guests, ...newGuests] });
          return newGuests.length;
        },

        createBudgetCategory: (data) => {
          const c: GuestBudgetCategory = {
            id: uuid(),
            wedding_id: get().weddingId,
            name: data.name ?? "New category",
            planned_amount: data.planned_amount ?? 0,
            actual_amount: 0,
            created_at: nowIso(),
          };
          set({ budgetCategories: [...get().budgetCategories, c] });
          return c;
        },
        updateBudgetCategory: (id, patch) => {
          set({
            budgetCategories: get().budgetCategories.map((c) =>
              c.id === id ? { ...c, ...patch } : c
            ),
          });
        },
        deleteBudgetCategory: (id) => {
          set({
            budgetCategories: get().budgetCategories.filter((c) => c.id !== id),
            expenses: get().expenses.map((e) =>
              e.category_id === id ? { ...e, category_id: null } : e
            ),
          });
        },

        createExpense: (data) => {
          const e: GuestExpense = {
            id: uuid(),
            wedding_id: get().weddingId,
            category_id: data.category_id ?? null,
            vendor_id: data.vendor_id ?? null,
            title: data.title ?? "Untitled expense",
            planned_amount: data.planned_amount ?? 0,
            actual_amount: data.actual_amount ?? 0,
            payment_status: data.payment_status ?? "unpaid",
            due_date: data.due_date ?? null,
            paid_date: data.paid_date ?? null,
            notes: data.notes ?? null,
            receipt_file_url: null,
            created_at: nowIso(),
          };
          set({ expenses: [...get().expenses, e] });
          if (e.category_id) {
            set({ budgetCategories: recalcCategoryActual(get(), e.category_id) });
          }
          return e;
        },
        updateExpense: (id, patch) => {
          const before = get().expenses.find((e) => e.id === id);
          set({
            expenses: get().expenses.map((e) => (e.id === id ? { ...e, ...patch } : e)),
          });
          const affectedCategoryIds = new Set<string>();
          if (before?.category_id) affectedCategoryIds.add(before.category_id);
          if (patch.category_id) affectedCategoryIds.add(patch.category_id);
          for (const cid of affectedCategoryIds) {
            set({ budgetCategories: recalcCategoryActual(get(), cid) });
          }
        },
        deleteExpense: (id) => {
          const before = get().expenses.find((e) => e.id === id);
          set({ expenses: get().expenses.filter((e) => e.id !== id) });
          if (before?.category_id) {
            set({ budgetCategories: recalcCategoryActual(get(), before.category_id) });
          }
        },

        reset: () => {
          set(emptyState(uuid()));
        },

        exportSnapshot: () => {
          const s = get();
          return {
            schemaVersion: s.schemaVersion,
            weddingId: s.weddingId,
            wedding: s.wedding,
            tasks: s.tasks,
            vendors: s.vendors,
            guests: s.guests,
            budgetCategories: s.budgetCategories,
            expenses: s.expenses,
          };
        },
      };
    },
    {
      name: "vowplan:guest:v1",
      version: SCHEMA_VERSION,
      // Only persist the data, not the action functions.
      partialize: (state) => ({
        schemaVersion: state.schemaVersion,
        weddingId: state.weddingId,
        wedding: state.wedding,
        tasks: state.tasks,
        vendors: state.vendors,
        guests: state.guests,
        budgetCategories: state.budgetCategories,
        expenses: state.expenses,
      }),
    }
  )
);

// Subscribe to store state without re-rendering on every change.
// Useful for read-only checks (e.g. "does the user have guest data?")
// outside of React.
export function getGuestSnapshot(): GuestSnapshot {
  return useGuestStore.getState().exportSnapshot();
}

export function hasGuestData(): boolean {
  const s = useGuestStore.getState();
  return s.wedding !== null;
}
