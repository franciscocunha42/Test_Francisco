"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { weddingSchema } from "@/lib/schemas/wedding";

const DEFAULT_BUDGET_CATEGORIES = [
  { name: "Venue & Rentals",        planned_amount: 10500 },
  { name: "Catering & Cake",        planned_amount:  8500 },
  { name: "Photography & Video",    planned_amount:  3500 },
  { name: "Flowers & Decor",        planned_amount:  2500 },
  { name: "Music & Entertainment",  planned_amount:  1500 },
  { name: "Beauty & Attire",        planned_amount:  2000 },
  { name: "Honeymoon",              planned_amount:  1500 },
];

export async function createWedding(formData: FormData) {
  const user = await requireUser();
  const raw = Object.fromEntries(formData);
  const parsed = weddingSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0].message };

  const supabase = createClient();
  const { data: wedding, error } = await supabase
    .from("weddings")
    .insert({ ...parsed.data, created_by: user.id })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };

  const { error: memberError } = await supabase.from("wedding_members").insert({
    wedding_id: wedding.id,
    user_id: user.id,
    role: "owner",
  });

  if (memberError) return { ok: false, error: memberError.message };

  await supabase.from("budget_categories").insert(
    DEFAULT_BUDGET_CATEGORIES.map(({ name, planned_amount }) => ({
      wedding_id: wedding.id,
      name,
      planned_amount,
      actual_amount: 0,
    }))
  );

  redirect(`/${wedding.id}/dashboard`);
}

export async function updateWedding(weddingId: string, formData: FormData) {
  const raw = Object.fromEntries(formData);
  const parsed = weddingSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0].message };

  const supabase = createClient();
  const { error } = await supabase
    .from("weddings")
    .update(parsed.data)
    .eq("id", weddingId);

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/${weddingId}/settings`);
  revalidatePath(`/${weddingId}/dashboard`);
  return { ok: true };
}

export async function patchWeddingInline(
  weddingId: string,
  data: {
    name: string;
    partner_one_name: string;
    partner_two_name: string;
    wedding_date?: string | null;
    venue_name?: string | null;
    location?: string | null;
    total_budget?: number;
    currency?: string;
  }
): Promise<{ ok: boolean; error?: string }> {
  const parsed = weddingSchema.safeParse({ total_budget: 0, currency: "USD", ...data });
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0].message };

  const supabase = createClient();
  const { error } = await supabase
    .from("weddings")
    .update(parsed.data)
    .eq("id", weddingId);

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/${weddingId}/settings`);
  revalidatePath(`/${weddingId}/dashboard`);
  return { ok: true };
}

export async function deleteWedding(weddingId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("weddings").delete().eq("id", weddingId);
  if (error) return { ok: false, error: error.message };
  redirect("/onboarding");
}

export async function inviteMember(weddingId: string, email: string, role: string) {
  const supabase = createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .single();

  if (!profile) return { ok: false, error: "No user found with that email address." };

  const { error } = await supabase.from("wedding_members").upsert({
    wedding_id: weddingId,
    user_id: profile.id,
    role: role as "partner" | "planner" | "viewer",
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/${weddingId}/settings`);
  return { ok: true };
}

export async function removeMember(weddingId: string, userId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("wedding_members")
    .delete()
    .eq("wedding_id", weddingId)
    .eq("user_id", userId);

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/${weddingId}/settings`);
  return { ok: true };
}
