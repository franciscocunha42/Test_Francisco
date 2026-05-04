"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireWeddingMember } from "@/lib/auth";
import { budgetCategorySchema, expenseSchema } from "@/lib/schemas/budget";

export async function createBudgetCategory(weddingId: string, data: unknown) {
  await requireWeddingMember(weddingId);
  const parsed = budgetCategorySchema.safeParse(data);
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0].message };

  const supabase = createClient();
  const { error } = await supabase
    .from("budget_categories")
    .insert({ ...parsed.data, wedding_id: weddingId, actual_amount: 0 });

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/${weddingId}/budget`);
  return { ok: true };
}

export async function updateBudgetCategory(weddingId: string, categoryId: string, data: unknown) {
  await requireWeddingMember(weddingId);
  const parsed = budgetCategorySchema.partial().safeParse(data);
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0].message };

  const supabase = createClient();
  const { error } = await supabase
    .from("budget_categories")
    .update(parsed.data)
    .eq("id", categoryId)
    .eq("wedding_id", weddingId);

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/${weddingId}/budget`);
  return { ok: true };
}

export async function deleteBudgetCategory(weddingId: string, categoryId: string) {
  await requireWeddingMember(weddingId);
  const supabase = createClient();
  const { error } = await supabase
    .from("budget_categories")
    .delete()
    .eq("id", categoryId)
    .eq("wedding_id", weddingId);

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/${weddingId}/budget`);
  return { ok: true };
}

export async function createExpense(weddingId: string, data: unknown) {
  await requireWeddingMember(weddingId);
  const parsed = expenseSchema.safeParse(data);
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0].message };

  const supabase = createClient();
  const { error: expErr } = await supabase
    .from("expenses")
    .insert({ ...parsed.data, wedding_id: weddingId });

  if (expErr) return { ok: false, error: expErr.message };

  // Update category actual_amount
  if (parsed.data.category_id && parsed.data.actual_amount) {
    await recalcCategoryActual(supabase, parsed.data.category_id);
  }

  revalidatePath(`/${weddingId}/budget`);
  revalidatePath(`/${weddingId}/suppliers`);
  revalidatePath(`/${weddingId}/dashboard`);
  return { ok: true };
}

export async function updateExpense(weddingId: string, expenseId: string, data: unknown) {
  await requireWeddingMember(weddingId);
  const parsed = expenseSchema.partial().safeParse(data);
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0].message };

  const supabase = createClient();
  const { data: existing } = await supabase
    .from("expenses")
    .select("category_id")
    .eq("id", expenseId)
    .single();

  const { error } = await supabase
    .from("expenses")
    .update(parsed.data)
    .eq("id", expenseId)
    .eq("wedding_id", weddingId);

  if (error) return { ok: false, error: error.message };

  const categoryId = parsed.data.category_id ?? existing?.category_id;
  if (categoryId) await recalcCategoryActual(supabase, categoryId);

  revalidatePath(`/${weddingId}/budget`);
  revalidatePath(`/${weddingId}/suppliers`);
  revalidatePath(`/${weddingId}/dashboard`);
  return { ok: true };
}

export async function deleteExpense(weddingId: string, expenseId: string) {
  await requireWeddingMember(weddingId);
  const supabase = createClient();

  const { data: existing } = await supabase
    .from("expenses")
    .select("category_id")
    .eq("id", expenseId)
    .single();

  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", expenseId)
    .eq("wedding_id", weddingId);

  if (error) return { ok: false, error: error.message };
  if (existing?.category_id) await recalcCategoryActual(supabase, existing.category_id);

  revalidatePath(`/${weddingId}/budget`);
  revalidatePath(`/${weddingId}/suppliers`);
  revalidatePath(`/${weddingId}/dashboard`);
  return { ok: true };
}

export async function patchExpenseStatus(
  weddingId: string,
  expenseId: string,
  status: "unpaid" | "deposit_paid" | "partially_paid" | "paid",
): Promise<{ ok: boolean; error?: string }> {
  await requireWeddingMember(weddingId);
  const supabase = createClient();
  const { error } = await supabase
    .from("expenses")
    .update({ payment_status: status })
    .eq("id", expenseId)
    .eq("wedding_id", weddingId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/${weddingId}/budget`);
  revalidatePath(`/${weddingId}/suppliers`);
  revalidatePath(`/${weddingId}/dashboard`);
  return { ok: true };
}

// Recalculate budget_categories.actual_amount from expenses
async function recalcCategoryActual(supabase: ReturnType<typeof import("@/lib/supabase/server").createClient>, categoryId: string) {
  const { data } = await supabase
    .from("expenses")
    .select("actual_amount")
    .eq("category_id", categoryId);

  const total = (data ?? []).reduce((sum, e) => sum + (e.actual_amount ?? 0), 0);
  await supabase
    .from("budget_categories")
    .update({ actual_amount: total })
    .eq("id", categoryId);
}
