"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireWeddingMember } from "@/lib/auth";
import { vendorSchema } from "@/lib/schemas/vendor";
import { DEFAULT_PORTO_VENUES } from "@/lib/data/default-porto-venues";

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

export async function seedDefaultVenues(weddingId: string) {
  await requireWeddingMember(weddingId);
  const supabase = createClient();

  // Skip venues that already exist for this wedding (idempotent).
  const { data: existing } = await supabase
    .from("vendors")
    .select("name")
    .eq("wedding_id", weddingId)
    .eq("category", "venue");
  const existingNames = new Set((existing ?? []).map((r) => (r as { name: string }).name));

  const rows = DEFAULT_PORTO_VENUES
    .filter((v) => !existingNames.has(v.name))
    .map((v) => ({
      wedding_id: weddingId,
      name: v.name,
      category: "venue" as const,
      subcategory: v.subcategory,
      status: "researching" as const,
      quoted_price: v.quoted_price ?? null,
      price_per_person: v.price_per_person ?? null,
      min_capacity: v.min_capacity ?? null,
      max_capacity: v.max_capacity ?? null,
      rating: v.rating ?? null,
      notes: v.notes ?? null,
    }));

  if (rows.length === 0) return { ok: true, inserted: 0 };

  const { error } = await supabase.from("vendors").insert(rows);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/${weddingId}/suppliers`);
  revalidatePath(`/${weddingId}/dashboard`);
  return { ok: true, inserted: rows.length };
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
