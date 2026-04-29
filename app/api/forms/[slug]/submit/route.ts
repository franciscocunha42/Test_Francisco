import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const body = await req.json();
    const { responses } = body as { responses: Record<string, unknown> };

    const supabase = createAdminClient();

    // Resolve form
    const { data: form, error: formErr } = await supabase
      .from("forms")
      .select("id, wedding_id, is_active")
      .eq("public_slug", params.slug)
      .single();

    if (formErr || !form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }
    if (!form.is_active) {
      return NextResponse.json({ error: "This form is no longer accepting responses" }, { status: 403 });
    }

    // Best-effort: find matching guest by email from responses
    let guestId: string | null = null;
    const emailAnswer = Object.values(responses).find(
      (v) => typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
    ) as string | undefined;

    if (emailAnswer) {
      const { data: guest } = await supabase
        .from("guests")
        .select("id, rsvp_status")
        .eq("wedding_id", form.wedding_id)
        .eq("email", emailAnswer)
        .single();

      if (guest) {
        guestId = guest.id;

        // Try to update rsvp_status from an attending question
        const attendingAnswer = Object.values(responses).find(
          (v) => typeof v === "string" && (v.toLowerCase().includes("yes") || v.toLowerCase().includes("no") || v.toLowerCase().includes("can't") || v.toLowerCase().includes("attending"))
        ) as string | undefined;

        if (attendingAnswer) {
          const attending = /yes|attending|there/i.test(attendingAnswer);
          await supabase
            .from("guests")
            .update({ rsvp_status: attending ? "attending" : "not_attending" })
            .eq("id", guest.id);
        }

        // Update meal choice if present (look for a meal-like answer)
        const mealChoices = ["chicken", "fish", "vegan", "vegetarian", "children"];
        const mealAnswer = Object.values(responses).find(
          (v) => typeof v === "string" && mealChoices.some((m) => v.toLowerCase().includes(m))
        ) as string | undefined;

        if (mealAnswer) {
          await supabase.from("guests").update({ meal_choice: mealAnswer }).eq("id", guest.id);
        }
      }
    }

    const { error: insertErr } = await supabase.from("form_responses").insert({
      form_id: form.id,
      guest_id: guestId,
      response_json: responses,
    });

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
