"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { deleteGuest, updateGuest } from "@/lib/actions/guest";
import { Button } from "@/components/ui/button";
import { GuestFormDialog } from "@/components/GuestFormDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useT } from "@/lib/i18n/provider";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import type { Guest, RsvpStatus } from "@/lib/types/database";
import type { GuestFormValues } from "@/lib/schemas/guest";

const rsvpStyles: Record<RsvpStatus, string> = {
  attending:     "bg-emerald-100 text-emerald-800 border-emerald-200",
  not_attending: "bg-red-100 text-red-800 border-red-200",
  pending:       "bg-secondary text-secondary-foreground border-transparent",
};

const rsvpLabelKeys: Record<RsvpStatus, TranslationKey> = {
  attending:     "guests.attending",
  not_attending: "guests.notAttending",
  pending:       "guests.pending",
};

interface GuestTableProps {
  guests: Guest[];
  weddingId: string;
  onEditSubmit?: (data: GuestFormValues, existing?: Guest) => Promise<{ ok: boolean; error?: string }>;
  onDelete?: (guestId: string) => Promise<{ ok: boolean; error?: string }>;
  onRsvpChange?: (guestId: string, status: RsvpStatus) => Promise<{ ok: boolean; error?: string }>;
}

export function GuestTable({ guests, weddingId, onEditSubmit, onDelete, onRsvpChange }: GuestTableProps) {
  const t = useT();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [pendingRsvp, setPendingRsvp] = useState<Record<string, boolean>>({});

  const filtered = guests.filter((g) => {
    const name = `${g.first_name} ${g.last_name}`.toLowerCase();
    const matchSearch = name.includes(search.toLowerCase()) || (g.email ?? "").includes(search.toLowerCase());
    const matchFilter = filter === "all" || g.rsvp_status === filter || (filter === "dietary" && !!g.dietary_requirements);
    return matchSearch && matchFilter;
  });

  async function handleDelete(guest: Guest) {
    const result = onDelete
      ? await onDelete(guest.id)
      : await deleteGuest(weddingId, guest.id);
    if (result?.ok === false) toast.error(result.error);
    else toast.success(t("guests.guestDeleted"));
  }

  async function handleRsvpChange(guest: Guest, status: RsvpStatus) {
    if (status === guest.rsvp_status) return;
    setPendingRsvp((p) => ({ ...p, [guest.id]: true }));
    const result = onRsvpChange
      ? await onRsvpChange(guest.id, status)
      : await updateGuest(weddingId, guest.id, { rsvp_status: status });
    setPendingRsvp((p) => { const { [guest.id]: _, ...rest } = p; return rest; });
    if (result?.ok === false) toast.error(result.error);
    else toast.success(t("guests.markedAs").replace("{name}", guest.first_name).replace("{status}", t(rsvpLabelKeys[status])));
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("guests.search")}
          className="flex h-9 flex-1 rounded-md border border-input bg-background px-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <div className="flex gap-1 flex-wrap">
          {["all", "attending", "not_attending", "pending", "dietary"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${filter === f ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}
            >
              {f === "all" ? t("common.all") : f === "dietary" ? t("guests.dietaryNeeds") : t(rsvpLabelKeys[f as RsvpStatus])}
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-md border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">{t("guests.colName")}</th>
              <th className="hidden sm:table-cell px-4 py-2.5 text-left font-medium text-muted-foreground">{t("guests.colEmail")}</th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">{t("guests.colRsvp")}</th>
              <th className="hidden md:table-cell px-4 py-2.5 text-left font-medium text-muted-foreground">{t("guests.colMeal")}</th>
              <th className="w-20 px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((guest) => (
              <tr key={guest.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium">{guest.first_name} {guest.last_name}</p>
                  {guest.party_name && <p className="text-xs text-muted-foreground">{guest.party_name}</p>}
                  {guest.dietary_requirements && (
                    <p className="text-xs text-amber-600 mt-0.5">⚠ {guest.dietary_requirements}</p>
                  )}
                </td>
                <td className="hidden sm:table-cell px-4 py-3 text-muted-foreground">{guest.email ?? "—"}</td>
                <td className="px-4 py-3">
                  <select
                    value={guest.rsvp_status}
                    disabled={!!pendingRsvp[guest.id]}
                    onChange={(e) => handleRsvpChange(guest, e.target.value as RsvpStatus)}
                    className={`cursor-pointer rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors appearance-none disabled:opacity-50 ${rsvpStyles[guest.rsvp_status]}`}
                  >
                    <option value="attending">{t("guests.attending")}</option>
                    <option value="not_attending">{t("guests.notAttending")}</option>
                    <option value="pending">{t("guests.pending")}</option>
                  </select>
                </td>
                <td className="hidden md:table-cell px-4 py-3 text-muted-foreground">{guest.meal_choice ?? "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <GuestFormDialog
                      weddingId={weddingId}
                      guest={guest}
                      onSubmit={onEditSubmit}
                      trigger={<Button variant="ghost" size="icon" className="h-7 w-7"><Pencil className="h-3.5 w-3.5" /></Button>}
                    />
                    <ConfirmDialog
                      trigger={<Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>}
                      title={t("guests.confirmDelete")}
                      description={`${guest.first_name} ${guest.last_name}`}
                      onConfirm={() => handleDelete(guest)}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">{t("guests.noneFound")}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
