"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { weddingSchema } from "@/lib/schemas/wedding";
import { scaleDefaultCategories } from "@/lib/utils/default-budget";

export async function setDefaultWedding(weddingId: string): Promise<{ ok: boolean; error?: string }> {
  const user = await requireUser();
  const supabase = createClient();

  // Verify membership
  const { data: membership } = await supabase
    .from("wedding_members")
    .select("id")
    .eq("wedding_id", weddingId)
    .eq("user_id", user.id)
    .single();

  if (!membership) return { ok: false, error: "Not a member of this wedding." };

  // Clear existing defaults for this user, then set the new one
  await supabase
    .from("wedding_members")
    .update({ is_default: false })
    .eq("user_id", user.id);

  const { error } = await supabase
    .from("wedding_members")
    .update({ is_default: true })
    .eq("wedding_id", weddingId)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

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
    scaleDefaultCategories(parsed.data.total_budget).map(({ name, planned_amount }) => ({
      wedding_id: wedding.id,
      name,
      planned_amount,
      actual_amount: 0,
    }))
  );

  redirect(`/${wedding.id}/setup`);
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
