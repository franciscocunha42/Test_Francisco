"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { deleteGuest } from "@/lib/actions/guest";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GuestFormDialog } from "@/components/GuestFormDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import type { Guest } from "@/lib/types/database";
import type { GuestFormValues } from "@/lib/schemas/guest";

const rsvpColors: Record<string, "success" | "destructive" | "secondary"> = {
  attending: "success",
  not_attending: "destructive",
  pending: "secondary",
};

const rsvpLabels: Record<string, string> = {
  attending: "Attending",
  not_attending: "Not Attending",
  pending: "Pending",
};

interface GuestTableProps {
  guests: Guest[];
  weddingId: string;
  /** Override default server-action mutations (used by guest mode). */
  onEditSubmit?: (data: GuestFormValues, existing?: Guest) => Promise<{ ok: boolean; error?: string }>;
  onDelete?: (guestId: string) => Promise<{ ok: boolean; error?: string }>;
}

export function GuestTable({ guests, weddingId, onEditSubmit, onDelete }: GuestTableProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");

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
    else toast.success("Guest removed");
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search guests..."
          className="flex h-9 flex-1 rounded-md border border-input bg-background px-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <div className="flex gap-1 flex-wrap">
          {["all", "attending", "not_attending", "pending", "dietary"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${filter === f ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}
            >
              {f === "all" ? "All" : f === "dietary" ? "Dietary Needs" : rsvpLabels[f]}
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-md border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Name</th>
              <th className="hidden sm:table-cell px-4 py-2.5 text-left font-medium text-muted-foreground">Email</th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">RSVP</th>
              <th className="hidden md:table-cell px-4 py-2.5 text-left font-medium text-muted-foreground">Meal</th>
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
                  <Badge variant={rsvpColors[guest.rsvp_status]}>{rsvpLabels[guest.rsvp_status]}</Badge>
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
                      title="Remove guest"
                      description={`Remove ${guest.first_name} ${guest.last_name}?`}
                      onConfirm={() => handleDelete(guest)}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">No guests found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
