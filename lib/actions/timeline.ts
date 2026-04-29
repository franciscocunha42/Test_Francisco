"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireWeddingMember } from "@/lib/auth";
import { taskSchema } from "@/lib/schemas/timeline";
import { generateDefaultTasks } from "@/lib/utils/seed-tasks";

export async function createTask(weddingId: string, data: unknown) {
  await requireWeddingMember(weddingId);
  const parsed = taskSchema.safeParse(data);
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0].message };

  const supabase = createClient();
  const { error } = await supabase
    .from("timeline_tasks")
    .insert({ ...parsed.data, wedding_id: weddingId });

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/${weddingId}/timeline`);
  revalidatePath(`/${weddingId}/dashboard`);
  return { ok: true };
}

export async function updateTask(weddingId: string, taskId: string, data: unknown) {
  await requireWeddingMember(weddingId);
  const parsed = taskSchema.partial().safeParse(data);
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0].message };

  const supabase = createClient();
  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.status === "completed") updateData.completed_at = new Date().toISOString();
  else if (parsed.data.status) updateData.completed_at = null;

  const { error } = await supabase
    .from("timeline_tasks")
    .update(updateData)
    .eq("id", taskId)
    .eq("wedding_id", weddingId);

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/${weddingId}/timeline`);
  revalidatePath(`/${weddingId}/dashboard`);
  return { ok: true };
}

export async function deleteTask(weddingId: string, taskId: string) {
  await requireWeddingMember(weddingId);
  const supabase = createClient();
  const { error } = await supabase
    .from("timeline_tasks")
    .delete()
    .eq("id", taskId)
    .eq("wedding_id", weddingId);

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/${weddingId}/timeline`);
  return { ok: true };
}

export async function completeTask(weddingId: string, taskId: string) {
  return updateTask(weddingId, taskId, {
    status: "completed",
    completed_at: new Date().toISOString(),
  });
}

export async function generateDefaultTimelineTasks(weddingId: string) {
  await requireWeddingMember(weddingId);
  const supabase = createClient();

  const { data: weddingData } = await supabase
    .from("weddings")
    .select("wedding_date")
    .eq("id", weddingId)
    .single();

  const wedding = weddingData as { wedding_date: string | null } | null;
  if (!wedding?.wedding_date) return { ok: false, error: "Wedding date not set." };

  const tasks = generateDefaultTasks(new Date(wedding.wedding_date), weddingId);
  const { error } = await supabase.from("timeline_tasks").insert(tasks);

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/${weddingId}/timeline`);
  return { ok: true };
}
