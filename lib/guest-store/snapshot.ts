import { z } from "zod";

// Schema for the payload sent to claimGuestWedding. Mirrors the
// store shape but uses lenient field validation since most data has
// already been validated client-side via the per-entity zod schemas.

const taskShape = z.object({
  id: z.string(),
  wedding_id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  category: z.string().nullable(),
  due_date: z.string().nullable(),
  status: z.enum(["not_started", "in_progress", "completed"]),
  completed_at: z.string().nullable(),
  priority: z.enum(["low", "medium", "high"]),
  assigned_to: z.string().nullable(),
  sort_order: z.number(),
  created_at: z.string(),
});

const vendorShape = z.object({
  id: z.string(),
  wedding_id: z.string(),
  name: z.string(),
  category: z.enum([
    "venue", "catering", "dj", "music", "photography", "videography",
    "flowers", "cake", "transport", "makeup", "dress", "suit",
    "stationery", "other",
  ]),
  contact_name: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  website: z.string().nullable(),
  quoted_price: z.number().nullable(),
  actual_cost: z.number().nullable(),
  status: z.enum(["researching", "contacted", "shortlisted", "booked", "rejected"]),
  notes: z.string().nullable(),
  contract_file_url: z.string().nullable(),
  created_at: z.string(),
});

const guestShape = z.object({
  id: z.string(),
  wedding_id: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  party_name: z.string().nullable(),
  invitation_status: z.enum(["not_sent", "sent", "opened", "responded"]),
  rsvp_status: z.enum(["pending", "attending", "not_attending"]),
  meal_choice: z.string().nullable(),
  dietary_requirements: z.string().nullable(),
  plus_one_allowed: z.boolean(),
  plus_one_name: z.string().nullable(),
  notes: z.string().nullable(),
  created_at: z.string(),
});

const budgetCategoryShape = z.object({
  id: z.string(),
  wedding_id: z.string(),
  name: z.string(),
  planned_amount: z.number(),
  actual_amount: z.number(),
  created_at: z.string(),
});

const expenseShape = z.object({
  id: z.string(),
  wedding_id: z.string(),
  category_id: z.string().nullable(),
  vendor_id: z.string().nullable(),
  title: z.string(),
  planned_amount: z.number(),
  actual_amount: z.number(),
  payment_status: z.enum(["unpaid", "deposit_paid", "partially_paid", "paid"]),
  due_date: z.string().nullable(),
  paid_date: z.string().nullable(),
  notes: z.string().nullable(),
  receipt_file_url: z.string().nullable(),
  created_at: z.string(),
});

const weddingShape = z.object({
  id: z.string(),
  name: z.string().min(1),
  partner_one_name: z.string().min(1),
  partner_two_name: z.string().min(1),
  wedding_date: z.string().nullable(),
  venue_name: z.string().nullable(),
  location: z.string().nullable(),
  total_budget: z.number(),
  currency: z.string(),
  created_at: z.string(),
});

export const guestSnapshotSchema = z.object({
  schemaVersion: z.literal(1),
  weddingId: z.string(),
  wedding: weddingShape,
  tasks: z.array(taskShape),
  vendors: z.array(vendorShape),
  guests: z.array(guestShape),
  budgetCategories: z.array(budgetCategoryShape),
  expenses: z.array(expenseShape),
});

export type GuestSnapshotPayload = z.infer<typeof guestSnapshotSchema>;
