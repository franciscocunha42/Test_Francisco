// Client-safe template draft for vendor outreach. Used in guest mode where
// server actions and Supabase access aren't available; also used as a fallback
// when the Anthropic API key isn't configured.

import { formatDate } from "@/lib/utils/format";

export interface VendorEmailWeddingContext {
  partner_one_name: string;
  partner_two_name: string;
  wedding_date: string | null;
  venue_name: string | null;
  location: string | null;
  guest_count: number;
}

export interface VendorEmailVendorContext {
  name: string;
  category: string;
  contact_name: string | null;
  notes: string | null;
}

export interface VendorEmailDraft {
  subject: string;
  body: string;
}

export function templateOutreach(
  wedding: VendorEmailWeddingContext,
  vendor: VendorEmailVendorContext,
): VendorEmailDraft {
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

  const coupleSig =
    wedding.partner_one_name && wedding.partner_two_name
      ? `${wedding.partner_one_name} & ${wedding.partner_two_name}`
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
    coupleSig,
  ].filter((line, i, arr) => !(line === "" && arr[i - 1] === "")).join("\n");

  const subjectCouple = coupleSig ? ` — ${coupleSig}` : "";
  return {
    subject: `Wedding inquiry${subjectCouple}`,
    body,
  };
}

export function templateReply(
  wedding: VendorEmailWeddingContext,
  vendor: VendorEmailVendorContext,
): string {
  const greeting = vendor.contact_name ? `Hi ${vendor.contact_name},` : "Hello,";
  const coupleSig =
    wedding.partner_one_name && wedding.partner_two_name
      ? `${wedding.partner_one_name} & ${wedding.partner_two_name}`
      : "";
  return [
    greeting,
    "",
    "Thanks so much for getting back to us — we appreciate the details.",
    "",
    "Would you be open to a quick call so we can talk through next steps? Mornings on weekdays generally work best for us; happy to fit around your schedule.",
    "",
    `Thanks again,${coupleSig ? `\n${coupleSig}` : ""}`,
  ].join("\n");
}
