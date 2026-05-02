"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireWeddingMember } from "@/lib/auth";
import { formSchema, formQuestionSchema } from "@/lib/schemas/form";
import { slugify } from "@/lib/utils/format";
import { nanoid } from "@/lib/utils/nanoid";

export async function createForm(weddingId: string, data: unknown) {
  await requireWeddingMember(weddingId);
  const parsed = formSchema.safeParse(data);
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0].message };

  const supabase = createClient();
  const slug = `${slugify(parsed.data.title)}-${nanoid(6)}`;

  const { data: form, error } = await supabase
    .from("forms")
    .insert({ ...parsed.data, wedding_id: weddingId, public_slug: slug })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/${weddingId}/forms`);
  return { ok: true, data: form };
}

export async function updateForm(weddingId: string, formId: string, data: unknown) {
  await requireWeddingMember(weddingId);
  const parsed = formSchema.partial().safeParse(data);
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0].message };

  const supabase = createClient();
  const { error } = await supabase
    .from("forms")
    .update(parsed.data)
    .eq("id", formId)
    .eq("wedding_id", weddingId);

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/${weddingId}/forms`);
  revalidatePath(`/${weddingId}/forms/${formId}`);
  return { ok: true };
}

export async function deleteForm(weddingId: string, formId: string) {
  await requireWeddingMember(weddingId);
  const supabase = createClient();
  const { error } = await supabase
    .from("forms")
    .delete()
    .eq("id", formId)
    .eq("wedding_id", weddingId);

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/${weddingId}/forms`);
  return { ok: true };
}

export async function upsertFormQuestions(
  weddingId: string,
  formId: string,
  questions: unknown[]
) {
  await requireWeddingMember(weddingId);
  const supabase = createClient();

  // Delete all existing and re-insert (simple replace strategy)
  await supabase.from("form_questions").delete().eq("form_id", formId);

  const parsed = questions.map((q, i) => {
    const r = formQuestionSchema.parse(q);
    return { ...r, form_id: formId, sort_order: i };
  });

  const { error } = await supabase.from("form_questions").insert(parsed);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/${weddingId}/forms/${formId}`);
  return { ok: true };
}

export async function updateRsvpConfig(
  weddingId: string,
  formId: string,
  config: { meal_options?: string[]; allow_new_guests?: boolean; deadline?: string | null }
) {
  await requireWeddingMember(weddingId);
  const supabase = createClient();
  const { error } = await supabase
    .from("forms")
    .update({ config_json: config })
    .eq("id", formId)
    .eq("wedding_id", weddingId);

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/${weddingId}/forms/${formId}`);
  return { ok: true };
}

// Seed canonical RSVP questions into a form
export async function applyRsvpTemplate(weddingId: string, formId: string) {
  const questions = [
    { question_text: "Your full name",                              question_type: "text",     required: true,  sort_order: 0, options_json: null },
    { question_text: "Your email address",                          question_type: "email",    required: true,  sort_order: 1, options_json: null },
    { question_text: "Will you be attending?",                      question_type: "radio",    required: true,  sort_order: 2, options_json: ["Yes, I'll be there!", "Sorry, I can't make it"] },
    { question_text: "Plus-one name (if applicable)",               question_type: "text",     required: false, sort_order: 3, options_json: null },
    { question_text: "Meal choice",                                 question_type: "select",   required: true,  sort_order: 4, options_json: ["Chicken", "Fish", "Vegan / Vegetarian", "Children's meal"] },
    { question_text: "Any dietary requirements or allergies?",      question_type: "textarea", required: false, sort_order: 5, options_json: null },
    { question_text: "Song request — we'll try to play it!",        question_type: "text",     required: false, sort_order: 6, options_json: null },
    { question_text: "A message for the couple",                    question_type: "textarea", required: false, sort_order: 7, options_json: null },
  ];
  return upsertFormQuestions(weddingId, formId, questions);
}
