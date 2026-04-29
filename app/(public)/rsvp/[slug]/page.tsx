import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { PublicRSVPForm } from "@/components/PublicRSVPForm";
import type { Database } from "@/lib/types/database";

export default async function PublicRsvpPage({ params }: { params: { slug: string } }) {
  // Use anon client — no user session here
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: form } = await supabase
    .from("forms")
    .select("*")
    .eq("public_slug", params.slug)
    .eq("is_active", true)
    .single();

  if (!form) notFound();

  const { data: questions } = await supabase
    .from("form_questions")
    .select("*")
    .eq("form_id", form.id)
    .order("sort_order");

  return <PublicRSVPForm form={form} questions={questions ?? []} />;
}
