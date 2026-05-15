"use client";

import { useEffect, useState, useTransition } from "react";
import { AlertTriangle, Copy, Mail, MailX, UserMinus } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { removeMember } from "@/lib/actions/wedding";
import { createInvitation, revokeInvitation } from "@/lib/actions/invitations";
import { formatDate } from "@/lib/utils/format";
import type { WeddingMember, Profile, WeddingInvitation } from "@/lib/types/database";

function isMissingInvitationsTable(message: string | undefined): boolean {
  if (!message) return false;
  return message.includes("schema cache") || message.includes("wedding_invitations");
}

interface Props {
  weddingId: string;
}

const ACCESS_OPTIONS = [
  { value: "partner", label: "Editor (Partner)", access: "edit" },
  { value: "planner", label: "Editor (Planner)", access: "edit" },
  { value: "viewer",  label: "Viewer",            access: "view" },
] as const;

function statusBadgeVariant(status: WeddingInvitation["status"]) {
  switch (status) {
    case "accepted": return "success" as const;
    case "pending":  return "info" as const;
    case "revoked":  return "secondary" as const;
    case "expired":  return "warning" as const;
  }
}

export function MembersAndInvitationsCard({ weddingId }: Props) {
  const supabase = createClient();
  const [members, setMembers] = useState<(WeddingMember & { profiles: Profile | null })[]>([]);
  const [invitations, setInvitations] = useState<WeddingInvitation[]>([]);
  const [missingTable, setMissingTable] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("partner");
  const [pending, startTransition] = useTransition();

  async function load() {
    const [membersRes, invitesRes] = await Promise.all([
      supabase
        .from("wedding_members")
        .select("*, profiles(*)")
        .eq("wedding_id", weddingId)
        .order("created_at", { ascending: true }),
      supabase
        .from("wedding_invitations")
        .select("*")
        .eq("wedding_id", weddingId)
        .order("invited_at", { ascending: false }),
    ]);
    setMembers((membersRes.data ?? []) as (WeddingMember & { profiles: Profile | null })[]);
    setInvitations((invitesRes.data ?? []) as WeddingInvitation[]);
    setMissingTable(isMissingInvitationsTable(invitesRes.error?.message));
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [weddingId]);

  function handleInvite() {
    if (!email) return;
    startTransition(async () => {
      const result = await createInvitation(weddingId, email, role);
      if (!result.ok) { toast.error(result.error ?? "Couldn't send invite"); return; }
      if (result.emailSent === false && result.invitation) {
        // Invitation row created but email send failed — auto-copy link so the
        // inviter can share it manually right away.
        const inviteUrl = `${window.location.origin}/invite/${result.invitation.token}`;
        try {
          await navigator.clipboard.writeText(inviteUrl);
          toast.warning(
            `Email couldn't be sent (${result.error ?? "unknown"}). Invite link copied to clipboard — share it manually.`,
            { duration: 8000 },
          );
        } catch {
          toast.warning(
            `Email couldn't be sent. Open Pending invitations below and copy the link.`,
            { duration: 8000 },
          );
        }
      } else {
        toast.success("Invitation sent");
      }
      setEmail("");
      await load();
    });
  }

  async function handleRemoveMember(userId: string) {
    const result = await removeMember(weddingId, userId);
    if (result?.ok === false) toast.error(result.error);
    else { toast.success("Member removed"); setMembers((m) => m.filter((x) => x.user_id !== userId)); }
  }

  async function handleRevoke(invitationId: string) {
    const result = await revokeInvitation(weddingId, invitationId);
    if (!result.ok) { toast.error(result.error); return; }
    toast.success("Invitation revoked");
    await load();
  }

  function copyInviteLink(token: string) {
    const url = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(url).then(
      () => toast.success("Invitation link copied"),
      () => toast.error("Failed to copy link"),
    );
  }

  const pendingInvites = invitations.filter((i) => i.status === "pending");
  const inviteHistory = invitations.filter((i) => i.status !== "pending");

  return (
    <Card id="members">
      <CardHeader>
        <CardTitle>Members & access</CardTitle>
        <CardDescription>
          Invite collaborators by email. Editors can change everything; viewers can only see your plans.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {missingTable && (
          <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div className="space-y-1">
              <p className="font-medium">Invitations table is missing.</p>
              <p className="text-xs">
                Run the database migration{" "}
                <code className="rounded bg-amber-100 px-1 py-0.5 font-mono">supabase/migrations/0008_invitations.sql</code>{" "}
                against your Supabase project (SQL editor → paste &amp; run). Until then, inviting collaborators won&apos;t work.
              </p>
            </div>
          </div>
        )}

        {/* Active members */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Active members</p>
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground">No members yet.</p>
          ) : (
            members.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                <div>
                  <p className="text-sm font-medium">{m.profiles?.full_name ?? m.profiles?.email ?? "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">{m.profiles?.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs capitalize">{m.role}</Badge>
                  {m.role !== "owner" && (
                    <ConfirmDialog
                      trigger={<Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"><UserMinus className="h-3.5 w-3.5" /></Button>}
                      title="Remove member"
                      description={`Remove ${m.profiles?.full_name ?? m.profiles?.email ?? "this member"} from the wedding?`}
                      onConfirm={() => handleRemoveMember(m.user_id)}
                    />
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <Separator />

        {/* Invite form */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Invite by email</p>
          <div className="flex flex-wrap gap-2">
            <Input
              type="email"
              placeholder="partner@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="min-w-[200px] flex-1"
            />
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ACCESS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleInvite} disabled={!email || pending}>
              <Mail className="mr-1.5 h-4 w-4" />
              {pending ? "Sending…" : "Send invite"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            We&apos;ll email a secure accept link. Editors can edit everything; viewers can only see plans.
          </p>
        </div>

        {/* Pending invitations */}
        {pendingInvites.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-sm font-medium">Pending invitations</p>
              {pendingInvites.map((inv) => (
                <div key={inv.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">{inv.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Invited {formatDate(inv.invited_at)} · expires {formatDate(inv.expires_at)} · {inv.role}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => copyInviteLink(inv.token)}>
                      <Copy className="mr-1 h-3.5 w-3.5" /> Copy link
                    </Button>
                    <ConfirmDialog
                      trigger={<Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"><MailX className="mr-1 h-3.5 w-3.5" /> Revoke</Button>}
                      title="Revoke invitation"
                      description={`Revoke the invitation sent to ${inv.email}?`}
                      onConfirm={() => handleRevoke(inv.id)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* History */}
        {inviteHistory.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-sm font-medium">Invitation history</p>
              <div className="rounded-md border">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Email</th>
                      <th className="px-3 py-2 text-left font-medium">Role</th>
                      <th className="px-3 py-2 text-left font-medium">Status</th>
                      <th className="px-3 py-2 text-left font-medium">When</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {inviteHistory.map((inv) => (
                      <tr key={inv.id}>
                        <td className="px-3 py-2">{inv.email}</td>
                        <td className="px-3 py-2 capitalize text-muted-foreground">{inv.role}</td>
                        <td className="px-3 py-2">
                          <Badge variant={statusBadgeVariant(inv.status)} className="capitalize">
                            {inv.status}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {formatDate(inv.responded_at ?? inv.invited_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
