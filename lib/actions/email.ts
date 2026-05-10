"use server";

import { createClient } from "@/lib/supabase/server";
import { requireWeddingMember } from "@/lib/auth";
import { formatDate } from "@/lib/utils/format";
import type { WeddingInvitation } from "@/lib/types/database";

interface SendResult {
  sent: number;
  skipped: number;
  errors: string[];
}

function rsvpEmailHtml(opts: {
  guestName: string;
  partnerOne: string;
  partnerTwo: string;
  weddingDate: string | null;
  venueName: string | null;
  location: string | null;
  rsvpUrl: string;
}): string {
  const { guestName, partnerOne, partnerTwo, weddingDate, venueName, location, rsvpUrl } = opts;
  const dateStr = weddingDate ? formatDate(weddingDate, "EEEE, MMMM d, yyyy") : "";
  const venue = venueName ?? location ?? "";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#fdf8f4;font-family:Georgia,serif">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <div style="background:#b5835a;padding:40px 32px;text-align:center">
      <p style="margin:0 0 8px;color:#fdf8f4;font-size:13px;letter-spacing:2px;text-transform:uppercase">You're invited</p>
      <h1 style="margin:0;color:#fff;font-size:28px;font-weight:normal">${partnerOne} &amp; ${partnerTwo}</h1>
      ${dateStr ? `<p style="margin:8px 0 0;color:#fdf8f4;font-size:15px">${dateStr}</p>` : ""}
      ${venue ? `<p style="margin:4px 0 0;color:#fde8d8;font-size:13px">${venue}</p>` : ""}
    </div>
    <div style="padding:36px 32px">
      <p style="margin:0 0 16px;font-size:16px;color:#3d2b1f">Dear ${guestName},</p>
      <p style="margin:0 0 16px;font-size:15px;color:#5c4033;line-height:1.6">
        We would be delighted to have you join us on our special day. Please let us know if you'll be able to attend by filling in your RSVP below.
      </p>
      <div style="text-align:center;margin:32px 0">
        <a href="${rsvpUrl}" style="display:inline-block;background:#b5835a;color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:15px;font-family:sans-serif">
          RSVP Now
        </a>
      </div>
      <p style="margin:0;font-size:13px;color:#8a7060;text-align:center">
        Or copy this link: <a href="${rsvpUrl}" style="color:#b5835a">${rsvpUrl}</a>
      </p>
    </div>
    <div style="padding:16px 32px;border-top:1px solid #f0e8e0;text-align:center">
      <p style="margin:0;font-size:12px;color:#b0a0a0">Powered by VowPlan</p>
    </div>
  </div>
</body>
</html>`;
}

export async function sendRsvpInvitations(
  weddingId: string,
  formId: string,
  guestIds: string[]
): Promise<SendResult> {
  await requireWeddingMember(weddingId);

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { sent: 0, skipped: guestIds.length, errors: ["Email sending is not configured. Add RESEND_API_KEY to your environment."] };
  }

  const supabase = createClient();

  const [weddingRes, formRes, guestsRes] = await Promise.all([
    supabase.from("weddings").select("partner_one_name, partner_two_name, wedding_date, venue_name, location, name").eq("id", weddingId).single(),
    supabase.from("forms").select("public_slug").eq("id", formId).single(),
    supabase.from("guests").select("id, first_name, last_name, email").in("id", guestIds).eq("wedding_id", weddingId),
  ]);

  if (!weddingRes.data || !formRes.data) {
    return { sent: 0, skipped: guestIds.length, errors: ["Wedding or form not found."] };
  }

  const wedding = weddingRes.data;
  const slug = formRes.data.public_slug as string;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const rsvpUrl = `${siteUrl}/rsvp/${slug}`;
  const guests = guestsRes.data ?? [];

  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);

  const fromAddress = process.env.RESEND_FROM_EMAIL ?? "noreply@vowplan.app";

  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const guest of guests) {
    const email = guest.email as string | null;
    if (!email) { skipped++; continue; }

    const guestName = `${guest.first_name} ${guest.last_name}`;
    const { error } = await resend.emails.send({
      from: `${wedding.partner_one_name} & ${wedding.partner_two_name} <${fromAddress}>`,
      to: email,
      subject: `You're invited — RSVP for ${wedding.name}`,
      html: rsvpEmailHtml({
        guestName,
        partnerOne: wedding.partner_one_name as string,
        partnerTwo: wedding.partner_two_name as string,
        weddingDate: wedding.wedding_date as string | null,
        venueName: wedding.venue_name as string | null,
        location: wedding.location as string | null,
        rsvpUrl,
      }),
    });

    if (error) {
      errors.push(`${guestName} (${email}): ${error.message}`);
    } else {
      sent++;
    }
  }

  return { sent, skipped: skipped + (guestIds.length - guests.length), errors };
}

function inviteEmailHtml(opts: {
  inviteeEmail: string;
  weddingName: string;
  partnerOne: string;
  partnerTwo: string;
  role: string;
  acceptUrl: string;
}): string {
  const { inviteeEmail, weddingName, partnerOne, partnerTwo, role, acceptUrl } = opts;
  const access = role === "viewer" ? "view" : "edit and view";
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#fdf8f4;font-family:Georgia,serif">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <div style="background:#b5835a;padding:32px;text-align:center">
      <p style="margin:0 0 8px;color:#fdf8f4;font-size:13px;letter-spacing:2px;text-transform:uppercase">You're invited to collaborate</p>
      <h1 style="margin:0;color:#fff;font-size:24px;font-weight:normal">${partnerOne} &amp; ${partnerTwo}</h1>
      <p style="margin:8px 0 0;color:#fdf8f4;font-size:14px">${weddingName}</p>
    </div>
    <div style="padding:32px">
      <p style="margin:0 0 16px;font-size:15px;color:#3d2b1f">Hi,</p>
      <p style="margin:0 0 16px;font-size:15px;color:#5c4033;line-height:1.6">
        ${partnerOne} &amp; ${partnerTwo} have invited you (<strong>${inviteeEmail}</strong>) to help plan their wedding on VowPlan with <strong>${access}</strong> access.
      </p>
      <div style="text-align:center;margin:28px 0">
        <a href="${acceptUrl}" style="display:inline-block;background:#b5835a;color:#fff;text-decoration:none;padding:13px 32px;border-radius:8px;font-size:15px;font-family:sans-serif">
          Accept invitation
        </a>
      </div>
      <p style="margin:16px 0 0;font-size:12px;color:#8a7060;text-align:center">
        Or paste this link into your browser:<br/>
        <a href="${acceptUrl}" style="color:#b5835a">${acceptUrl}</a>
      </p>
      <p style="margin:24px 0 0;font-size:12px;color:#a0907a;text-align:center">
        This link expires in 14 days. If you weren't expecting this invitation you can safely ignore this email.
      </p>
    </div>
    <div style="padding:14px 32px;border-top:1px solid #f0e8e0;text-align:center">
      <p style="margin:0;font-size:12px;color:#b0a0a0">Powered by VowPlan</p>
    </div>
  </div>
</body>
</html>`;
}

export async function sendInvitationEmail(
  weddingId: string,
  invitation: WeddingInvitation,
): Promise<{ ok: boolean; error?: string }> {
  await requireWeddingMember(weddingId);

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "Email sending is not configured. Add RESEND_API_KEY to send invitations automatically." };
  }

  const supabase = createClient();
  const { data: wedding } = await supabase
    .from("weddings")
    .select("name, partner_one_name, partner_two_name")
    .eq("id", weddingId)
    .single();
  if (!wedding) return { ok: false, error: "Wedding not found." };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const acceptUrl = `${siteUrl}/invite/${invitation.token}`;

  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);
  const fromAddress = process.env.RESEND_FROM_EMAIL ?? "noreply@vowplan.app";

  const { error } = await resend.emails.send({
    from: `${wedding.partner_one_name} & ${wedding.partner_two_name} <${fromAddress}>`,
    to: invitation.email,
    subject: `Invitation to plan ${wedding.name}`,
    html: inviteEmailHtml({
      inviteeEmail: invitation.email,
      weddingName: wedding.name as string,
      partnerOne: wedding.partner_one_name as string,
      partnerTwo: wedding.partner_two_name as string,
      role: invitation.role,
      acceptUrl,
    }),
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
