"use client";

import { useEffect, useState, useTransition } from "react";
import { Copy, Mail, MailX, UserMinus } from "lucide-react";
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
import { useT } from "@/lib/i18n/provider";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import type { WeddingMember, Profile, WeddingInvitation } from "@/lib/types/database";

interface Props {
  weddingId: string;
}

const ACCESS_OPTIONS: ReadonlyArray<{ value: string; labelKey: TranslationKey; access: string }> = [
  { value: "partner", labelKey: "members.roleEditorPartner", access: "edit" },
  { value: "planner", labelKey: "members.roleEditorPlanner", access: "edit" },
  { value: "viewer",  labelKey: "members.roleViewer",        access: "view" },
];

const INVITE_STATUS_KEYS: Record<WeddingInvitation["status"], TranslationKey> = {
  accepted: "members.statusAccepted",
  pending: "members.statusPending",
  revoked: "members.statusRevoked",
  expired: "members.statusExpired",
};

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
  const t = useT();
  const [members, setMembers] = useState<(WeddingMember & { profiles: Profile | null })[]>([]);
  const [invitations, setInvitations] = useState<WeddingInvitation[]>([]);
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
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [weddingId]);

  function handleInvite() {
    if (!email) return;
    startTransition(async () => {
      const result = await createInvitation(weddingId, email, role);
      if (!result.ok) { toast.error(result.error ?? t("common.somethingWrong")); return; }
      if (result.error) {
        // Invitation row created but email send failed — surface as warning.
        toast.warning(`${t("members.invitationSent")}. ${result.error}`);
      } else {
        toast.success(t("members.invitationSent"));
      }
      setEmail("");
      await load();
    });
  }

  async function handleRemoveMember(userId: string) {
    const result = await removeMember(weddingId, userId);
    if (result?.ok === false) toast.error(result.error);
    else { toast.success(t("members.memberRemoved")); setMembers((m) => m.filter((x) => x.user_id !== userId)); }
  }

  async function handleRevoke(invitationId: string) {
    const result = await revokeInvitation(weddingId, invitationId);
    if (!result.ok) { toast.error(result.error); return; }
    toast.success(t("members.invitationRevoked"));
    await load();
  }

  function copyInviteLink(token: string) {
    const url = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(url).then(
      () => toast.success(t("common.copied")),
      () => toast.error(t("members.copyFailed")),
    );
  }

  const pendingInvites = invitations.filter((i) => i.status === "pending");
  const inviteHistory = invitations.filter((i) => i.status !== "pending");

  return (
    <Card id="members">
      <CardHeader>
        <CardTitle>{t("settings.membersAccess")}</CardTitle>
        <CardDescription>
          {t("settings.membersDesc")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Active members */}
        <div className="space-y-2">
          <p className="text-sm font-medium">{t("members.activeMembers")}</p>
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("members.noMembers")}</p>
          ) : (
            members.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                <div>
                  <p className="text-sm font-medium">{m.profiles?.full_name ?? m.profiles?.email ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{m.profiles?.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs capitalize">{m.role}</Badge>
                  {m.role !== "owner" && (
                    <ConfirmDialog
                      trigger={<Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"><UserMinus className="h-3.5 w-3.5" /></Button>}
                      title={t("members.remove")}
                      description={m.profiles?.full_name ?? m.profiles?.email ?? ""}
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
          <p className="text-sm font-medium">{t("members.inviteByEmail")}</p>
          <div className="flex flex-wrap gap-2">
            <Input
              type="email"
              placeholder={t("members.emailPh")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="min-w-[200px] flex-1"
            />
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ACCESS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{t(o.labelKey)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleInvite} disabled={!email || pending}>
              <Mail className="mr-1.5 h-4 w-4" />
              {pending ? t("members.sending") : t("members.sendInvite")}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {t("members.inviteDesc")}
          </p>
        </div>

        {/* Pending invitations */}
        {pendingInvites.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-sm font-medium">{t("members.pending")}</p>
              {pendingInvites.map((inv) => (
                <div key={inv.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">{inv.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(inv.invited_at)} · {formatDate(inv.expires_at)} · {inv.role}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => copyInviteLink(inv.token)}>
                      <Copy className="mr-1 h-3.5 w-3.5" /> {t("members.copyLink")}
                    </Button>
                    <ConfirmDialog
                      trigger={<Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"><MailX className="mr-1 h-3.5 w-3.5" /> {t("members.revoke")}</Button>}
                      title={t("members.revokeInvitation")}
                      description={inv.email}
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
              <p className="text-sm font-medium">{t("members.history")}</p>
              <div className="rounded-md border">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">{t("members.email")}</th>
                      <th className="px-3 py-2 text-left font-medium">{t("members.role")}</th>
                      <th className="px-3 py-2 text-left font-medium">{t("members.status")}</th>
                      <th className="px-3 py-2 text-left font-medium">{t("members.when")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {inviteHistory.map((inv) => (
                      <tr key={inv.id}>
                        <td className="px-3 py-2">{inv.email}</td>
                        <td className="px-3 py-2 capitalize text-muted-foreground">{inv.role}</td>
                        <td className="px-3 py-2">
                          <Badge variant={statusBadgeVariant(inv.status)} className="capitalize">
                            {t(INVITE_STATUS_KEYS[inv.status])}
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
