"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { GuestAppShell } from "@/components/GuestAppShell";
import { SeatingPlan } from "@/components/SeatingPlan";
import { useGuestStore } from "@/lib/guest-store/store";

export default function GuestSeatingPage() {
  const router = useRouter();
  const wedding = useGuestStore((s) => s.wedding);
  const tables = useGuestStore((s) => s.seatingTables);
  const guests = useGuestStore((s) => s.guests);
  const createTable = useGuestStore((s) => s.createSeatingTable);
  const updateTable = useGuestStore((s) => s.updateSeatingTable);
  const deleteTable = useGuestStore((s) => s.deleteSeatingTable);
  const assignGuest = useGuestStore((s) => s.assignGuestToTable);
  const bulkImport = useGuestStore((s) => s.bulkImportSeating);

  useEffect(() => {
    if (!wedding) router.replace("/plan");
  }, [wedding, router]);

  if (!wedding) return null;

  return (
    <GuestAppShell>
      <SeatingPlan
        weddingId="guest"
        tables={tables}
        guests={guests}
        onAssign={async (guestId, tableId) => assignGuest(guestId, tableId)}
        onDeleteTable={async (id) => { deleteTable(id); return { ok: true }; }}
        onCreateTableSubmit={async (data) => {
          createTable(data);
          return { ok: true };
        }}
        onEditTableSubmit={async (data, existing) => {
          if (!existing) return { ok: true };
          return updateTable(existing.id, data);
        }}
        onImport={async (rows) => {
          const result = bulkImport(rows);
          return { ok: true, ...result };
        }}
      />
    </GuestAppShell>
  );
}
