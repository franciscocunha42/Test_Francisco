"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireWeddingMember } from "@/lib/auth";
import { vendorSchema } from "@/lib/schemas/vendor";

export async function createVendor(weddingId: string, data: unknown) {
  await requireWeddingMember(weddingId);
  const parsed = vendorSchema.safeParse(data);
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0].message };

  const supabase = createClient();
  const { error } = await supabase
    .from("vendors")
    .insert({ ...parsed.data, wedding_id: weddingId });

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/${weddingId}/suppliers`);
  revalidatePath(`/${weddingId}/dashboard`);
  return { ok: true };
}

export async function updateVendor(weddingId: string, vendorId: string, data: unknown) {
  await requireWeddingMember(weddingId);
  const parsed = vendorSchema.partial().safeParse(data);
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0].message };

  const supabase = createClient();
  const { error } = await supabase
    .from("vendors")
    .update(parsed.data)
    .eq("id", vendorId)
    .eq("wedding_id", weddingId);

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/${weddingId}/suppliers`);
  return { ok: true };
}

export async function deleteVendor(weddingId: string, vendorId: string) {
  await requireWeddingMember(weddingId);
  const supabase = createClient();
  const { error } = await supabase
    .from("vendors")
    .delete()
    .eq("id", vendorId)
    .eq("wedding_id", weddingId);

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/${weddingId}/suppliers`);
  return { ok: true };
}
