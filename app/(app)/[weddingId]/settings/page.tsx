"use client";

import { useEffect, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateWedding, deleteWedding, inviteMember, removeMember } from "@/lib/actions/wedding";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { exportToCsv } from "@/lib/utils/csv";
import { toast } from "sonner";
import { Trash2, UserMinus, Download } from "lucide-react";
import type { Wedding, WeddingMember, Profile } from "@/lib/types/database";

export default function SettingsPage({ params }: { params: { weddingId: string } }) {
  const { weddingId } = params;
  const supabase = createClient();

  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [members, setMembers] = useState<(WeddingMember & { profiles: Profile })[]>([]);
  const [isSaving, startSaving] = useTransition();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("partner");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    async function load() {
      const [{ data: w }, { data: m }] = await Promise.all([
        supabase.from("weddings").select("*").eq("id", weddingId).single(),
        supabase.from("wedding_members").select("*, profiles(*)").eq("wedding_id", weddingId),
      ]);
      setWedding(w);
      setMembers((m ?? []) as (WeddingMember & { profiles: Profile })[]);
    }
    load();
  }, [weddingId]);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startSaving(() => {
      updateWedding(weddingId, data).then((r) => {
        if (r?.ok === false) toast.error(r.error);
        else toast.success("Wedding details saved");
      });
    });
  }

  async function handleInvite() {
    if (!inviteEmail) return;
    setInviting(true);
    const result = await inviteMember(weddingId, inviteEmail, inviteRole);
    setInviting(false);
    if (result?.ok === false) toast.error(result.error);
    else { toast.success("Member invited"); setInviteEmail(""); }
  }

  async function handleRemoveMember(userId: string) {
    const result = await removeMember(weddingId, userId);
    if (result?.ok === false) toast.error(result.error);
    else { toast.success("Member removed"); setMembers((m) => m.filter((x) => x.user_id !== userId)); }
  }

  async function handleExportGuests() {
    const { data } = await supabase.from("guests").select("*").eq("wedding_id", weddingId);
    if (data) exportToCsv(data as Record<string, unknown>[], "guests.csv");
  }

  async function handleExportExpenses() {
    const { data } = await supabase.from("expenses").select("*").eq("wedding_id", weddingId);
    if (data) exportToCsv(data as Record<string, unknown>[], "expenses.csv");
  }

  if (!wedding) return null;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-serif text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your wedding workspace</p>
      </div>

      {/* Wedding details */}
      <Card>
        <CardHeader><CardTitle>Wedding Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="name">Wedding Name</Label>
              <Input id="name" name="name" defaultValue={wedding.name} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="partner_one_name">Partner One</Label>
                <Input id="partner_one_name" name="partner_one_name" defaultValue={wedding.partner_one_name} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="partner_two_name">Partner Two</Label>
                <Input id="partner_two_name" name="partner_two_name" defaultValue={wedding.partner_two_name} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="wedding_date">Wedding Date</Label>
                <Input id="wedding_date" name="wedding_date" type="date" defaultValue={wedding.wedding_date ?? ""} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="currency">Currency</Label>
                <Input id="currency" name="currency" defaultValue={wedding.currency} maxLength={3} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="total_budget">Total Budget</Label>
                <Input id="total_budget" name="total_budget" type="number" min="0" defaultValue={wedding.total_budget} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="venue_name">Venue Name</Label>
                <Input id="venue_name" name="venue_name" defaultValue={wedding.venue_name ?? ""} />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="location">Location</Label>
              <Input id="location" name="location" defaultValue={wedding.location ?? ""} />
            </div>
            <Button type="submit">Save Changes</Button>
          </form>
        </CardContent>
      </Card>

      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>Invite your partner or wedding planner to collaborate</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {members.map((m) => (
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
                      description={`Remove ${m.profiles?.full_name ?? "this member"} from the wedding?`}
                      onConfirm={() => handleRemoveMember(m.user_id)}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
          <Separator />
          <div className="space-y-2">
            <p className="text-sm font-medium">Invite by email</p>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="partner@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1"
              />
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="partner">Partner</SelectItem>
                  <SelectItem value="planner">Planner</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleInvite} disabled={!inviteEmail || inviting}>
                {inviting ? "Inviting..." : "Invite"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export */}
      <Card>
        <CardHeader>
          <CardTitle>Export Data</CardTitle>
          <CardDescription>Download your wedding data as CSV</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button variant="outline" onClick={handleExportGuests}>
            <Download className="mr-1.5 h-4 w-4" />Export Guests
          </Button>
          <Button variant="outline" onClick={handleExportExpenses}>
            <Download className="mr-1.5 h-4 w-4" />Export Expenses
          </Button>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <ConfirmDialog
            trigger={<Button variant="destructive"><Trash2 className="mr-1.5 h-4 w-4" />Delete Wedding</Button>}
            title="Delete wedding workspace"
            description="This will permanently delete the wedding, all guests, vendors, tasks, forms and budget data. This cannot be undone."
            confirmText={wedding.name}
            confirmLabel="Delete forever"
            onConfirm={async () => { await deleteWedding(weddingId); }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
