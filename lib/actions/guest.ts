"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireWeddingMember } from "@/lib/auth";
import { guestSchema } from "@/lib/schemas/guest";
import type { GuestCsvRow } from "@/lib/utils/csv";

export async function createGuest(weddingId: string, data: unknown) {
  await requireWeddingMember(weddingId);
  const parsed = guestSchema.safeParse(data);
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0].message };

  const supabase = createClient();
  const { error } = await supabase
    .from("guests")
    .insert({ ...parsed.data, wedding_id: weddingId });

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/${weddingId}/guests`);
  revalidatePath(`/${weddingId}/dashboard`);
  return { ok: true };
}

export async function updateGuest(weddingId: string, guestId: string, data: unknown) {
  await requireWeddingMember(weddingId);
  const parsed = guestSchema.partial().safeParse(data);
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0].message };

  const supabase = createClient();
  const { error } = await supabase
    .from("guests")
    .update(parsed.data)
    .eq("id", guestId)
    .eq("wedding_id", weddingId);

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/${weddingId}/guests`);
  return { ok: true };
}

export async function deleteGuest(weddingId: string, guestId: string) {
  await requireWeddingMember(weddingId);
  const supabase = createClient();
  const { error } = await supabase
    .from("guests")
    .delete()
    .eq("id", guestId)
    .eq("wedding_id", weddingId);

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/${weddingId}/guests`);
  return { ok: true };
}

export async function bulkImportGuests(weddingId: string, rows: GuestCsvRow[]) {
  await requireWeddingMember(weddingId);
  const supabase = createClient();

  const guests = rows.map((r) => ({
    wedding_id: weddingId,
    first_name: r.first_name,
    last_name: r.last_name,
    email: r.email || null,
    phone: r.phone || null,
    party_name: r.party_name || null,
    dietary_requirements: r.dietary_requirements || null,
    plus_one_allowed: r.plus_one_allowed === "yes" || r.plus_one_allowed === "true",
    invitation_status: "not_sent" as const,
    rsvp_status: "pending" as const,
  }));

  const { error } = await supabase.from("guests").insert(guests);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/${weddingId}/guests`);
  return { ok: true, count: guests.length };
}
