"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { GuestAppShell } from "@/components/GuestAppShell";
import { SuppliersClientView } from "@/components/SuppliersClientView";
import { useGuestStore } from "@/lib/guest-store/store";
import type { ExpenseFormValues } from "@/lib/schemas/budget";
import type { PaymentStatus } from "@/lib/types/database";
import type { DefaultVenue } from "@/lib/data/default-porto-venues";

export default function GuestSuppliersPage() {
  const router     = useRouter();
  const wedding    = useGuestStore((s) => s.wedding);
  const vendors    = useGuestStore((s) => s.vendors);
  const expenses   = useGuestStore((s) => s.expenses);
  const categories = useGuestStore((s) => s.budgetCategories);

  const createVendor = useGuestStore((s) => s.createVendor);
  const updateVendor = useGuestStore((s) => s.updateVendor);
  const deleteVendor = useGuestStore((s) => s.deleteVendor);
  const createExpense = useGuestStore((s) => s.createExpense);
  const updateExpense = useGuestStore((s) => s.updateExpense);
  const deleteExpense = useGuestStore((s) => s.deleteExpense);

  useEffect(() => {
    if (!wedding) router.replace("/plan");
  }, [wedding, router]);

  if (!wedding) return null;

  return (
    <GuestAppShell>
      <SuppliersClientView
        allVendors={vendors}
        expenses={expenses}
        categories={categories}
        weddingId="guest"
        currency={wedding.currency}
        onAddFromDirectory={async (venue: DefaultVenue) => {
          createVendor({
            name: venue.name,
            category: "venue",
            subcategory: venue.subcategory,
            status: "researching",
            price_per_person: venue.price_per_person,
            quoted_price: venue.quoted_price,
            min_capacity: venue.min_capacity,
            max_capacity: venue.max_capacity,
            rating: venue.rating,
            notes: venue.notes,
            photos: venue.photos ?? [],
          });
          return { ok: true };
        }}
        onVendorCreate={async (data) => { createVendor(data); return { ok: true }; }}
        onVendorEdit={async (data, existing) => {
          if (existing) updateVendor(existing.id, data);
          return { ok: true };
        }}
        onVendorDelete={async (id) => { deleteVendor(id); return { ok: true }; }}
        onAddExpense={async (data: ExpenseFormValues) => { createExpense(data); return { ok: true }; }}
        onUpdateExpense={async (id, data: ExpenseFormValues) => { updateExpense(id, data); return { ok: true }; }}
        onDeleteExpense={async (id) => { deleteExpense(id); return { ok: true }; }}
        onUpdateExpenseStatus={async (id, status: PaymentStatus) => {
          updateExpense(id, { payment_status: status });
          return { ok: true };
        }}
      />
    </GuestAppShell>
  );
}
