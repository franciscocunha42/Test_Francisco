"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Upload } from "lucide-react";
import { GuestAppShell } from "@/components/GuestAppShell";
import { GuestTable } from "@/components/GuestTable";
import { GuestFormDialog } from "@/components/GuestFormDialog";
import { GuestImportDialog } from "@/components/GuestImportDialog";
import { Button } from "@/components/ui/button";
import { useGuestStore } from "@/lib/guest-store/store";

export default function GuestGuestsPage() {
  const router = useRouter();
  const wedding = useGuestStore((s) => s.wedding);
  const guests = useGuestStore((s) => s.guests);
  const createGuest = useGuestStore((s) => s.createGuest);
  const updateGuest = useGuestStore((s) => s.updateGuest);
  const deleteGuest = useGuestStore((s) => s.deleteGuest);
  const bulkImport = useGuestStore((s) => s.bulkImportGuests);

  useEffect(() => {
    if (!wedding) router.replace("/plan");
  }, [wedding, router]);

  if (!wedding) return null;

  const attending = guests.filter((g) => g.rsvp_status === "attending").length;
  const declined = guests.filter((g) => g.rsvp_status === "not_attending").length;
  const pending = guests.filter((g) => g.rsvp_status === "pending").length;

  return (
    <GuestAppShell>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-serif text-2xl font-semibold">Guests &amp; RSVP</h1>
            <p className="text-sm text-muted-foreground">{guests.length} guests · {attending} attending · {declined} declined · {pending} pending</p>
          </div>
          <div className="flex gap-2">
            <GuestImportDialog
              weddingId="guest"
              onImport={async (rows) => {
                const count = bulkImport(
                  rows.map((r) => ({
                    first_name: r.first_name,
                    last_name: r.last_name,
                    email: r.email ?? null,
                    phone: r.phone ?? null,
                    party_name: r.party_name ?? null,
                    dietary_requirements: r.dietary_requirements ?? null,
                    plus_one_allowed: r.plus_one_allowed === "true" || r.plus_one_allowed === "yes" || r.plus_one_allowed === "1",
                  }))
                );
                return { ok: true, count };
              }}
              trigger={<Button variant="outline" size="sm"><Upload className="mr-1.5 h-3.5 w-3.5" />Import CSV</Button>}
            />
            <GuestFormDialog
              weddingId="guest"
              onSubmit={async (data) => { createGuest(data); return { ok: true }; }}
              trigger={<Button size="sm"><Plus className="mr-1.5 h-3.5 w-3.5" />Add Guest</Button>}
            />
          </div>
        </div>

        <GuestTable
          guests={guests}
          weddingId="guest"
          onEditSubmit={async (data, existing) => {
            if (existing) updateGuest(existing.id, data);
            return { ok: true };
          }}
          onDelete={async (id) => { deleteGuest(id); return { ok: true }; }}
          onRsvpChange={async (id, status) => { updateGuest(id, { rsvp_status: status }); return { ok: true }; }}
        />
      </div>
    </GuestAppShell>
  );
}
