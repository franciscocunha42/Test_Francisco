"use server";

import { createClient } from "@/lib/supabase/server";
import { requireWeddingMember } from "@/lib/auth";
import { getAnthropicClient, ANTHROPIC_EMAIL_MODEL } from "@/lib/ai/anthropic";
import { formatDate } from "@/lib/utils/format";

interface WeddingContext {
  partner_one_name: string;
  partner_two_name: string;
  wedding_date: string | null;
  venue_name: string | null;
  location: string | null;
  guest_count: number;
}

interface VendorContext {
  name: string;
  category: string;
  contact_name: string | null;
  notes: string | null;
}

interface Draft {
  subject: string;
  body: string;
}

async function loadContext(weddingId: string, vendorId: string): Promise<
  | { ok: true; wedding: WeddingContext; vendor: VendorContext }
  | { ok: false; error: string }
> {
  const supabase = createClient();
  const [weddingRes, vendorRes, guestCountRes] = await Promise.all([
    supabase
      .from("weddings")
      .select("partner_one_name, partner_two_name, wedding_date, venue_name, location")
      .eq("id", weddingId)
      .single(),
    supabase
      .from("vendors")
      .select("name, category, contact_name, notes")
      .eq("id", vendorId)
      .eq("wedding_id", weddingId)
      .single(),
    supabase
      .from("guests")
      .select("id", { count: "exact", head: true })
      .eq("wedding_id", weddingId),
  ]);

  if (weddingRes.error || !weddingRes.data) return { ok: false, error: "Wedding not found" };
  if (vendorRes.error || !vendorRes.data) return { ok: false, error: "Vendor not found" };

  return {
    ok: true,
    wedding: {
      partner_one_name: weddingRes.data.partner_one_name as string,
      partner_two_name: weddingRes.data.partner_two_name as string,
      wedding_date: (weddingRes.data.wedding_date as string | null) ?? null,
      venue_name: (weddingRes.data.venue_name as string | null) ?? null,
      location: (weddingRes.data.location as string | null) ?? null,
      guest_count: guestCountRes.count ?? 0,
    },
    vendor: {
      name: vendorRes.data.name as string,
      category: vendorRes.data.category as string,
      contact_name: (vendorRes.data.contact_name as string | null) ?? null,
      notes: (vendorRes.data.notes as string | null) ?? null,
    },
  };
}

function buildSystemPrompt(wedding: WeddingContext): string {
  const dateLine = wedding.wedding_date
    ? `Wedding date: ${formatDate(wedding.wedding_date, "EEEE, MMMM d, yyyy")}`
    : "Wedding date: not yet set";
  const venueLine = wedding.venue_name
    ? `Venue: ${wedding.venue_name}${wedding.location ? ` (${wedding.location})` : ""}`
    : wedding.location
      ? `Location: ${wedding.location}`
      : "Location: not yet decided";
  const guestLine = wedding.guest_count > 0
    ? `Expected guest count: approximately ${wedding.guest_count}`
    : "Expected guest count: not yet set";

  return [
    "You help couples write polite, professional emails to wedding vendors.",
    "",
    "Style guide:",
    "- Warm but professional tone. Plain language; no marketing fluff.",
    "- Short — usually 3 to 6 sentences for outreach, 2 to 5 sentences for replies.",
    "- No emoji. No ALL-CAPS. No fake intimacy.",
    "- Sign off with the couple's first names only (e.g. \"Avery & Jordan\").",
    "- Do NOT invent facts you weren't told. If a detail is missing, ask for it.",
    "",
    "Couple & wedding details:",
    `- Couple: ${wedding.partner_one_name} and ${wedding.partner_two_name}`,
    `- ${dateLine}`,
    `- ${venueLine}`,
    `- ${guestLine}`,
  ].join("\n");
}

function buildOutreachUserPrompt(vendor: VendorContext): string {
  const contactLine = vendor.contact_name
    ? `Contact name at the vendor: ${vendor.contact_name}.`
    : "We don't yet know the contact's name — open with a generic greeting.";
  const notesLine = vendor.notes
    ? `\n\nNotes from our shortlist: ${vendor.notes}`
    : "";

  return [
    `Draft the first-contact email to ${vendor.name} (category: ${vendor.category}).`,
    contactLine,
    "Goal: introduce ourselves briefly, share the wedding date / guest count / location if known, ask about availability and a rough quote, and request next steps (a call, a site visit, or a brochure).",
    "Return the email in this exact format:",
    "Subject: <subject line>",
    "",
    "<email body>",
    notesLine,
  ].join("\n");
}

function buildReplyUserPrompt(vendor: VendorContext, previousOutreach: string, vendorReply: string): string {
  const previousBlock = previousOutreach.trim()
    ? `Our most recent email to them:\n---\n${previousOutreach.trim()}\n---`
    : "We don't have a copy of our previous email handy — draft a reply that stands on its own.";
  return [
    `We're replying to ${vendor.name} (category: ${vendor.category}).`,
    previousBlock,
    "",
    "Their reply just arrived:",
    "---",
    vendorReply.trim(),
    "---",
    "",
    "Draft our response. Acknowledge what they said, answer any direct questions when you can from the wedding details (do NOT invent details), and propose a concrete next step (a call slot, a site visit, a document to share, etc.). If something they asked about isn't in the wedding details, ask them rather than guessing. Return only the email body — no subject line and no preamble.",
  ].join("\n");
}

function parseSubjectAndBody(text: string, fallbackVendorName: string): Draft {
  const trimmed = text.trim();
  const match = trimmed.match(/^subject:\s*(.+?)\s*\n+([\s\S]+)$/i);
  if (match) {
    return { subject: match[1].trim(), body: match[2].trim() };
  }
  return { subject: `Wedding inquiry — ${fallbackVendorName}`, body: trimmed };
}

function templateOutreach(wedding: WeddingContext, vendor: VendorContext): Draft {
  const greeting = vendor.contact_name ? `Hi ${vendor.contact_name},` : "Hello,";
  const dateLine = wedding.wedding_date
    ? `We're planning our wedding for ${formatDate(wedding.wedding_date, "MMMM d, yyyy")}`
    : "We're starting to plan our wedding";
  const venueLine = wedding.venue_name
    ? ` at ${wedding.venue_name}${wedding.location ? ` (${wedding.location})` : ""}`
    : wedding.location
      ? ` in ${wedding.location}`
      : "";
  const guestLine = wedding.guest_count > 0
    ? ` and expect around ${wedding.guest_count} guests`
    : "";

  const body = [
    greeting,
    "",
    `${dateLine}${venueLine}${guestLine}. We came across ${vendor.name} while researching ${vendor.category} options and would love to learn more about what you offer.`,
    "",
    "Could you let us know whether you're available on our date, share a rough idea of pricing, and let us know the best next step (a call or a meeting)?",
    "",
    "Thank you so much — looking forward to hearing from you.",
    "",
    `${wedding.partner_one_name} & ${wedding.partner_two_name}`,
  ].join("\n");

  return {
    subject: `Wedding inquiry — ${wedding.partner_one_name} & ${wedding.partner_two_name}`,
    body,
  };
}

function templateReply(wedding: WeddingContext, vendor: VendorContext): string {
  const greeting = vendor.contact_name ? `Hi ${vendor.contact_name},` : "Hello,";
  return [
    greeting,
    "",
    "Thanks so much for getting back to us — we appreciate the details.",
    "",
    "Would you be open to a quick call so we can talk through next steps? Mornings on weekdays generally work best for us; happy to fit around your schedule.",
    "",
    `Thanks again,\n${wedding.partner_one_name} & ${wedding.partner_two_name}`,
  ].join("\n");
}

export async function draftInitialOutreach(
  weddingId: string,
  vendorId: string,
): Promise<{ ok: true; draft: Draft; usedAI: boolean } | { ok: false; error: string }> {
  await requireWeddingMember(weddingId);
  const ctx = await loadContext(weddingId, vendorId);
  if (!ctx.ok) return { ok: false, error: ctx.error };

  const client = getAnthropicClient();
  if (!client) {
    return { ok: true, draft: templateOutreach(ctx.wedding, ctx.vendor), usedAI: false };
  }

  try {
    const response = await client.messages.create({
      model: ANTHROPIC_EMAIL_MODEL,
      max_tokens: 800,
      system: [
        {
          type: "text",
          text: buildSystemPrompt(ctx.wedding),
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        { role: "user", content: buildOutreachUserPrompt(ctx.vendor) },
      ],
    });
    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("\n");
    return { ok: true, draft: parseSubjectAndBody(text, ctx.vendor.name), usedAI: true };
  } catch (err) {
    console.error("[vendor-email] AI outreach failed, falling back to template", err);
    return { ok: true, draft: templateOutreach(ctx.wedding, ctx.vendor), usedAI: false };
  }
}

export async function draftReply(
  weddingId: string,
  vendorId: string,
  previousOutreach: string,
  vendorReply: string,
): Promise<{ ok: true; body: string; usedAI: boolean } | { ok: false; error: string }> {
  await requireWeddingMember(weddingId);
  if (!vendorReply.trim()) return { ok: false, error: "Paste the vendor's reply first." };

  const ctx = await loadContext(weddingId, vendorId);
  if (!ctx.ok) return { ok: false, error: ctx.error };

  const client = getAnthropicClient();
  if (!client) {
    return { ok: true, body: templateReply(ctx.wedding, ctx.vendor), usedAI: false };
  }

  try {
    const response = await client.messages.create({
      model: ANTHROPIC_EMAIL_MODEL,
      max_tokens: 800,
      thinking: { type: "adaptive" },
      output_config: { effort: "medium" },
      system: [
        {
          type: "text",
          text: buildSystemPrompt(ctx.wedding),
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        { role: "user", content: buildReplyUserPrompt(ctx.vendor, previousOutreach, vendorReply) },
      ],
    });
    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("\n")
      .trim();
    return { ok: true, body: text || templateReply(ctx.wedding, ctx.vendor), usedAI: true };
  } catch (err) {
    console.error("[vendor-email] AI reply failed, falling back to template", err);
    return { ok: true, body: templateReply(ctx.wedding, ctx.vendor), usedAI: false };
  }
}
