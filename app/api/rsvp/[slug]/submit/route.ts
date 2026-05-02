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

    const supabase = createAdminClient();

    // Resolve form
    const { data: form, error: formErr } = await supabase
      .from("forms")
      .select("id, wedding_id, is_active, config_json")
      .eq("public_slug", params.slug)
      .eq("type", "rsvp")
      .single();

    if (formErr || !form) {
      return NextResponse.json({ error: "RSVP form not found." }, { status: 404 });
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
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
