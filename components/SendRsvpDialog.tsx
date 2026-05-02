"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Mail, Send, CheckCircle2 } from "lucide-react";
import { sendRsvpInvitations } from "@/lib/actions/email";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { Guest } from "@/lib/types/database";

interface SendRsvpDialogProps {
  weddingId: string;
  formId: string;
  guests: Guest[];
  trigger: React.ReactNode;
}

export function SendRsvpDialog({ weddingId, formId, guests, trigger }: SendRsvpDialogProps) {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState<"pending" | "all">("pending");

  const withEmail = guests.filter((g) => !!g.email);
  const filtered = filter === "pending"
    ? withEmail.filter((g) => g.rsvp_status === "pending")
    : withEmail;

  const [selected, setSelected] = useState<Set<string>>(new Set());

  function openDialog() {
    // Pre-select all matching guests on open
    const ids = new Set(filtered.map((g) => g.id));
    setSelected(ids);
    setOpen(true);
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((g) => g.id)));
  }

  async function handleSend() {
    if (selected.size === 0) { toast.error("No guests selected."); return; }
    setSending(true);
    const result = await sendRsvpInvitations(weddingId, formId, [...selected]);
    setSending(false);

    if (result.errors.length > 0 && result.sent === 0) {
      toast.error(result.errors[0]);
    } else {
      const parts = [`${result.sent} invitation${result.sent !== 1 ? "s" : ""} sent`];
      if (result.skipped > 0) parts.push(`${result.skipped} skipped (no email)`);
      toast.success(parts.join(" · "));
      setOpen(false);
    }
  }

  const noEmailCount = guests.length - withEmail.length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild onClick={(e) => { e.preventDefault(); openDialog(); }}>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-4 w-4" />Send RSVP Invitations
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Filter toggle */}
          <div className="flex gap-2">
            {(["pending", "all"] as const).map((f) => (
              <button
                key={f}
                onClick={() => {
                  setFilter(f);
                  const ids = f === "pending"
                    ? withEmail.filter((g) => g.rsvp_status === "pending").map((g) => g.id)
                    : withEmail.map((g) => g.id);
                  setSelected(new Set(ids));
                }}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${filter === f ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}
              >
                {f === "pending" ? "Pending RSVP" : "All guests"}
              </button>
            ))}
          </div>

          {noEmailCount > 0 && (
            <p className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
              {noEmailCount} guest{noEmailCount !== 1 ? "s" : ""} without an email address will be skipped.
            </p>
          )}

          {filtered.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No guests with email addresses in this group.</p>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{selected.size} of {filtered.length} selected</span>
                <button onClick={toggleAll} className="text-xs text-primary hover:underline">
                  {selected.size === filtered.length ? "Deselect all" : "Select all"}
                </button>
              </div>
              <div className="max-h-56 overflow-y-auto rounded-md border divide-y">
                {filtered.map((g) => (
                  <label key={g.id} className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-muted/50">
                    <Checkbox
                      checked={selected.has(g.id)}
                      onCheckedChange={() => toggle(g.id)}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{g.first_name} {g.last_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{g.email}</p>
                    </div>
                    <Badge variant={g.rsvp_status === "attending" ? "success" : g.rsvp_status === "not_attending" ? "destructive" : "secondary"} className="shrink-0 text-xs">
                      {g.rsvp_status === "attending" ? "Attending" : g.rsvp_status === "not_attending" ? "Declined" : "Pending"}
                    </Badge>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSend} disabled={sending || selected.size === 0}>
            {sending ? "Sending…" : (
              <><Send className="mr-1.5 h-3.5 w-3.5" />Send to {selected.size}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
