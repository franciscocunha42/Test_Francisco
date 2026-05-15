import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { RsvpConfig } from "@/lib/types/database";

interface RsvpSubmitBody {
  first_name: string;
  last_name: string;
  email?: string | null;
  attending: boolean;
  meal_choice?: string | null;
  dietary_requirements?: string | null;
  notes?: string | null;
}

export async function POST(
  req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const body = (await req.json()) as RsvpSubmitBody;
    const { first_name, last_name, email, attending, meal_choice, dietary_requirements, notes } = body;

    if (!first_name?.trim() || !last_name?.trim()) {
      return NextResponse.json({ error: "First and last name are required." }, { status: 400 });
    }

    // Fail fast with a clear message if the deployment is missing the
    // service-role key. Without it the admin client can authenticate but
    // every query gets rejected by Supabase Auth, which previously showed
    // up as "RSVP form not found".
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json(
        {
          error:
            "Server is missing Supabase credentials (SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_URL). " +
            "Set them in your hosting provider's environment variables and redeploy.",
        },
        { status: 500 }
      );
    }

    const supabase = createAdminClient();

    // Resolve form by slug. Don't filter by type — the same endpoint serves
    // any form that uses the bespoke RSVP UI, and a stricter filter caused
    // "RSVP form not found." errors when the form was created with a
    // non-"rsvp" form_type (e.g. custom) but configured as an RSVP.
    const { data: form, error: formErr } = await supabase
      .from("forms")
      .select("id, wedding_id, is_active, config_json, public_slug")
      .eq("public_slug", params.slug)
      .maybeSingle();

    if (formErr) {
      console.error("[rsvp/submit] form lookup error", formErr);
      return NextResponse.json(
        {
          error:
            `Couldn't reach the database (${formErr.message}). ` +
            "This usually means the SUPABASE_SERVICE_ROLE_KEY env var is wrong or missing on the deployment.",
        },
        { status: 500 }
      );
    }
    if (!form) {
      return NextResponse.json(
        { error: `RSVP form not found for slug "${params.slug}". The form may have been deleted or the link is incorrect.` },
        { status: 404 }
      );
    }
    if (!form.is_active) {
      return NextResponse.json({ error: "This RSVP form is no longer accepting responses." }, { status: 403 });
    }

    const config = (form.config_json ?? {}) as RsvpConfig;
    const weddingId = form.wedding_id as string;

    // --- Guest matching ---
    // 1. Try by email
    // 2. Try by full name (case-insensitive)
    // 3. Create if allow_new_guests is true

    let guestId: string | null = null;
    let existingGuest: { id: string } | null = null;

    if (email) {
      const { data } = await supabase
        .from("guests")
        .select("id")
        .eq("wedding_id", weddingId)
        .ilike("email", email.trim())
        .maybeSingle();
      if (data) existingGuest = data;
    }

    if (!existingGuest) {
      const { data } = await supabase
        .from("guests")
        .select("id")
        .eq("wedding_id", weddingId)
        .ilike("first_name", first_name.trim())
        .ilike("last_name", last_name.trim())
        .maybeSingle();
      if (data) existingGuest = data;
    }

    if (existingGuest) {
      guestId = existingGuest.id;

      const patch: Record<string, unknown> = {
        rsvp_status: attending ? "attending" : "not_attending",
        invitation_status: "responded",
      };
      if (email && email.trim()) patch.email = email.trim();
      if (attending) {
        if (meal_choice) patch.meal_choice = meal_choice;
        if (dietary_requirements !== undefined) patch.dietary_requirements = dietary_requirements;
      }
      if (notes !== undefined) patch.notes = notes;

      await supabase.from("guests").update(patch).eq("id", guestId);
    } else if (config.allow_new_guests !== false) {
      // Create new guest
      const { data: newGuest, error: createErr } = await supabase
        .from("guests")
        .insert({
          wedding_id: weddingId,
          first_name: first_name.trim(),
          last_name: last_name.trim(),
          email: email?.trim() ?? null,
          rsvp_status: attending ? "attending" : "not_attending",
          invitation_status: "responded",
          meal_choice: attending ? (meal_choice ?? null) : null,
          dietary_requirements: attending ? (dietary_requirements ?? null) : null,
          notes: notes ?? null,
          plus_one_allowed: false,
        })
        .select("id")
        .single();

      if (createErr || !newGuest) {
        return NextResponse.json({ error: createErr?.message ?? "Failed to save your response." }, { status: 500 });
      }
      guestId = newGuest.id as string;
    } else {
      return NextResponse.json(
        { error: "We couldn't find your name on the guest list. Please contact the couple directly." },
        { status: 404 }
      );
    }

    // Record the raw response in form_responses for the couple to review
    await supabase.from("form_responses").insert({
      form_id: form.id as string,
      guest_id: guestId,
      response_json: {
        first_name,
        last_name,
        email: email ?? null,
        attending,
        meal_choice: meal_choice ?? null,
        dietary_requirements: dietary_requirements ?? null,
        notes: notes ?? null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[rsvp/submit] unexpected error", e);
    const msg = e instanceof Error ? e.message : "Invalid request.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
