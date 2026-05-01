"use server";

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { guestSnapshotSchema, type GuestSnapshotPayload } from "@/lib/guest-store/snapshot";

type ClaimResult =
  | { ok: true; weddingId: string }
  | { ok: false; error: string };

export async function claimGuestWedding(snapshot: unknown): Promise<ClaimResult> {
  const user = await requireUser();

  const parsed = guestSnapshotSchema.safeParse(snapshot);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid guest data" };
  }
  const data: GuestSnapshotPayload = parsed.data;

  const supabase = createClient();

  // 1. Insert the wedding row
  const { data: wedding, error: weddingErr } = await supabase
    .from("weddings")
    .insert({
      name: data.wedding.name,
      partner_one_name: data.wedding.partner_one_name,
      partner_two_name: data.wedding.partner_two_name,
      wedding_date: data.wedding.wedding_date,
      venue_name: data.wedding.venue_name,
      location: data.wedding.location,
      total_budget: data.wedding.total_budget,
      currency: data.wedding.currency,
      created_by: user.id,
    })
    .select()
    .single();

  if (weddingErr || !wedding) {
    return { ok: false, error: weddingErr?.message ?? "Failed to create wedding" };
  }

  const weddingId = wedding.id as string;

  // Helper that rolls back the wedding row (cascades delete child tables)
  // and returns a typed failure result.
  const rollback = async (msg: string): Promise<ClaimResult> => {
    await supabase.from("weddings").delete().eq("id", weddingId);
    return { ok: false, error: msg };
  };

  // 2. Owner membership row
  const { error: memberErr } = await supabase.from("wedding_members").insert({
    wedding_id: weddingId,
    user_id: user.id,
    role: "owner",
  });
  if (memberErr) return rollback(memberErr.message);

  // 3. Budget categories — capture client→server id map for expense rewrites
  const categoryRows = data.budgetCategories.map((c) => ({
    wedding_id: weddingId,
    name: c.name,
    planned_amount: c.planned_amount,
    actual_amount: c.actual_amount,
  }));
  const categoryIdMap = new Map<string, string>();
  if (categoryRows.length > 0) {
    const { data: insertedCategories, error: catErr } = await supabase
      .from("budget_categories")
      .insert(categoryRows)
      .select();
    if (catErr || !insertedCategories) return rollback(catErr?.message ?? "Failed to insert categories");
    insertedCategories.forEach((row, i) => {
      const clientId = data.budgetCategories[i].id;
      categoryIdMap.set(clientId, row.id as string);
    });
  }

  // 4. Vendors — capture id map for expense.vendor_id
  const vendorIdMap = new Map<string, string>();
  if (data.vendors.length > 0) {
    const vendorRows = data.vendors.map((v) => ({
      wedding_id: weddingId,
      name: v.name,
      category: v.category,
      contact_name: v.contact_name,
      email: v.email,
      phone: v.phone,
      website: v.website,
      quoted_price: v.quoted_price,
      actual_cost: v.actual_cost,
      status: v.status,
      notes: v.notes,
    }));
    const { data: insertedVendors, error: vendorErr } = await supabase
      .from("vendors")
      .insert(vendorRows)
      .select();
    if (vendorErr || !insertedVendors) return rollback(vendorErr?.message ?? "Failed to insert vendors");
    insertedVendors.forEach((row, i) => {
      vendorIdMap.set(data.vendors[i].id, row.id as string);
    });
  }

  // 5. Tasks and guests in parallel — no foreign keys between them and others
  const taskInsert = data.tasks.length > 0
    ? supabase.from("timeline_tasks").insert(
        data.tasks.map((t) => ({
          wedding_id: weddingId,
          title: t.title,
          description: t.description,
          category: t.category,
          due_date: t.due_date,
          status: t.status,
          priority: t.priority,
          sort_order: t.sort_order,
          completed_at: t.completed_at,
        }))
      )
    : Promise.resolve({ error: null });

  const guestInsert = data.guests.length > 0
    ? supabase.from("guests").insert(
        data.guests.map((g) => ({
          wedding_id: weddingId,
          first_name: g.first_name,
          last_name: g.last_name,
          email: g.email,
          phone: g.phone,
          party_name: g.party_name,
          invitation_status: g.invitation_status,
          rsvp_status: g.rsvp_status,
          meal_choice: g.meal_choice,
          dietary_requirements: g.dietary_requirements,
          plus_one_allowed: g.plus_one_allowed,
          plus_one_name: g.plus_one_name,
          notes: g.notes,
        }))
      )
    : Promise.resolve({ error: null });

  const [taskRes, guestRes] = await Promise.all([taskInsert, guestInsert]);
  if (taskRes.error) return rollback(taskRes.error.message);
  if (guestRes.error) return rollback(guestRes.error.message);

  // 6. Expenses — rewrite category_id and vendor_id via the maps
  if (data.expenses.length > 0) {
    const expenseRows = data.expenses.map((e) => ({
      wedding_id: weddingId,
      category_id: e.category_id ? categoryIdMap.get(e.category_id) ?? null : null,
      vendor_id: e.vendor_id ? vendorIdMap.get(e.vendor_id) ?? null : null,
      title: e.title,
      planned_amount: e.planned_amount,
      actual_amount: e.actual_amount,
      payment_status: e.payment_status,
      due_date: e.due_date,
      paid_date: e.paid_date,
      notes: e.notes,
    }));
    const { error: expenseErr } = await supabase.from("expenses").insert(expenseRows);
    if (expenseErr) return rollback(expenseErr.message);
  }

  return { ok: true, weddingId };
}
