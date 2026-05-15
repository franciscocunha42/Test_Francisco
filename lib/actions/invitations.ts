"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser, requireWeddingMember } from "@/lib/auth";
import type { WeddingInvitation, MemberRole } from "@/lib/types/database";

const INVITABLE_ROLES: Exclude<MemberRole, "owner">[] = ["partner", "planner", "viewer"];

function makeToken(): string {
  // 32 hex chars from crypto.randomUUID(), with the dashes stripped.
  return crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
}

export async function createInvitation(
  weddingId: string,
  email: string,
  role: string,
): Promise<{ ok: boolean; error?: string; invitation?: WeddingInvitation; emailSent?: boolean }> {
  const user = await requireUser();
  await requireWeddingMember(weddingId);

  const cleanedEmail = email.trim().toLowerCase();
  if (!cleanedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanedEmail)) {
    return { ok: false, error: "Enter a valid email address." };
  }
  if (!INVITABLE_ROLES.includes(role as Exclude<MemberRole, "owner">)) {
    return { ok: false, error: "Invalid role." };
  }

  const supabase = createClient();

  // Already a member?
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", cleanedEmail)
    .maybeSingle();

  if (existingProfile) {
    const { data: alreadyMember } = await supabase
      .from("wedding_members")
      .select("id")
      .eq("wedding_id", weddingId)
      .eq("user_id", existingProfile.id)
      .maybeSingle();
    if (alreadyMember) {
      return { ok: false, error: "That person is already a member of this wedding." };
    }
  }

  // Revoke prior pending invites to the same email so we don't accumulate
  // duplicate active tokens.
  await supabase
    .from("wedding_invitations")
    .update({ status: "revoked", responded_at: new Date().toISOString() })
    .eq("wedding_id", weddingId)
    .eq("status", "pending")
    .ilike("email", cleanedEmail);

  const token = makeToken();
  const { data: invitation, error } = await supabase
    .from("wedding_invitations")
    .insert({
      wedding_id: weddingId,
      email: cleanedEmail,
      role: role as Exclude<MemberRole, "owner">,
      token,
      status: "pending",
      invited_by: user.id,
      responded_at: null,
      accepted_by: null,
    })
    .select()
    .single();

  if (error || !invitation) {
    return { ok: false, error: error?.message ?? "Failed to create invitation." };
  }

  // Best-effort email send. Failure to send does not block the invitation —
  // the inviter can still copy the link from the history list.
  try {
    const { sendInvitationEmail } = await import("@/lib/actions/email");
    const sendRes = await sendInvitationEmail(weddingId, invitation as WeddingInvitation);
    if (!sendRes.ok) {
      // We don't roll back: the invitation row is the source of truth.
      // The UI surfaces the email error so the inviter can resend.
      revalidatePath(`/${weddingId}/settings`);
      return { ok: true, invitation: invitation as WeddingInvitation, error: sendRes.error, emailSent: false };
    }
  } catch (e) {
    revalidatePath(`/${weddingId}/settings`);
    return {
      ok: true,
      invitation: invitation as WeddingInvitation,
      error: e instanceof Error ? e.message : "Email could not be sent.",
      emailSent: false,
    };
  }

  revalidatePath(`/${weddingId}/settings`);
  return { ok: true, invitation: invitation as WeddingInvitation, emailSent: true };
}

export async function revokeInvitation(weddingId: string, invitationId: string) {
  await requireWeddingMember(weddingId);
  const supabase = createClient();
  const { error } = await supabase
    .from("wedding_invitations")
    .update({ status: "revoked", responded_at: new Date().toISOString() })
    .eq("id", invitationId)
    .eq("wedding_id", weddingId)
    .eq("status", "pending");
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/${weddingId}/settings`);
  return { ok: true };
}

export async function acceptInvitation(token: string): Promise<{ ok: boolean; error?: string; weddingId?: string }> {
  const user = await requireUser();
  const supabase = createClient();

  const { data: invitation, error: invErr } = await supabase
    .from("wedding_invitations")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (invErr || !invitation) return { ok: false, error: "Invitation not found." };
  if (invitation.status === "accepted") return { ok: true, weddingId: invitation.wedding_id };
  if (invitation.status === "revoked") return { ok: false, error: "This invitation has been revoked." };
  if (new Date(invitation.expires_at) < new Date()) {
    await supabase.from("wedding_invitations").update({ status: "expired" }).eq("id", invitation.id);
    return { ok: false, error: "This invitation has expired. Ask the workspace owner to send a new one." };
  }

  const userEmail = (user.email ?? "").toLowerCase();
  if (userEmail && userEmail !== invitation.email.toLowerCase()) {
    return {
      ok: false,
      error: `This invitation was sent to ${invitation.email}. Sign in with that email to accept.`,
    };
  }

  // Add the user to the wedding_members table.
  const { error: memberErr } = await supabase
    .from("wedding_members")
    .upsert({
      wedding_id: invitation.wedding_id,
      user_id: user.id,
      role: invitation.role,
    });
  if (memberErr) return { ok: false, error: memberErr.message };

  // Mark the invitation accepted (history is preserved).
  await supabase
    .from("wedding_invitations")
    .update({
      status: "accepted",
      responded_at: new Date().toISOString(),
      accepted_by: user.id,
    })
    .eq("id", invitation.id);

  revalidatePath(`/${invitation.wedding_id}/settings`);
  return { ok: true, weddingId: invitation.wedding_id };
}
