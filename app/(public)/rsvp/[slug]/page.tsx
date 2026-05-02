import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { PublicRSVPForm } from "@/components/PublicRSVPForm";
import { BespokeRsvpForm } from "@/components/BespokeRsvpForm";
import type { Database, Form, FormQuestion } from "@/lib/types/database";

export default async function PublicRsvpPage({ params }: { params: { slug: string } }) {
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

  // Bespoke RSVP form — fetch wedding details via admin client (anon can't read weddings directly)
  if (form.type === "rsvp") {
    const admin = createAdminClient();
    const { data: wedding } = await admin
      .from("weddings")
      .select("partner_one_name, partner_two_name, wedding_date, venue_name, location")
      .eq("id", (form as Form).wedding_id)
      .single();

    if (!wedding) notFound();

    return <BespokeRsvpForm form={form as Form} wedding={wedding} />;
  }

  // Generic form builder rendering for non-RSVP types
  const { data: questions } = await supabase
    .from("form_questions")
    .select("*")
    .eq("form_id", form.id)
    .order("sort_order");

  return <PublicRSVPForm form={form as Form} questions={(questions ?? []) as FormQuestion[]} />;
}
