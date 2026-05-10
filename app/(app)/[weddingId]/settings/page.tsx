"use client";

import { useEffect, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateWedding, deleteWedding } from "@/lib/actions/wedding";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { MembersAndInvitationsCard } from "@/components/MembersAndInvitationsCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CURRENCY_OPTIONS } from "@/lib/utils/currencies";
import { exportToCsv } from "@/lib/utils/csv";
import { toast } from "sonner";
import { Trash2, Download } from "lucide-react";
import type { Wedding } from "@/lib/types/database";

export default function SettingsPage({ params }: { params: { weddingId: string } }) {
  const { weddingId } = params;
  const supabase = createClient();

  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [isSaving, startSaving] = useTransition();
  const [currency, setCurrency] = useState("USD");

  useEffect(() => {
    async function load() {
      const { data: w } = await supabase
        .from("weddings")
        .select("*")
        .eq("id", weddingId)
        .single();
      setWedding(w);
      if (w?.currency) setCurrency(w.currency);
    }
    load();
  }, [weddingId, supabase]);

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
                <input type="hidden" name="currency" value={currency} />
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger id="currency"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CURRENCY_OPTIONS.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.code} — {c.label} ({c.symbol})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            <Button type="submit" disabled={isSaving}>{isSaving ? "Saving…" : "Save Changes"}</Button>
          </form>
        </CardContent>
      </Card>

      {/* Members & Invitations */}
      <MembersAndInvitationsCard weddingId={weddingId} />

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
