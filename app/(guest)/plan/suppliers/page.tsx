"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Store, Plus, PiggyBank, Wallet, CheckCircle2 } from "lucide-react";
import { GuestAppShell } from "@/components/GuestAppShell";
import { VendorCard } from "@/components/VendorCard";
import { VendorFormDialog } from "@/components/VendorFormDialog";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { capitalize, formatCurrency } from "@/lib/utils/format";
import { summariseVendorFinances } from "@/lib/utils/vendor-finance";
import { useGuestStore } from "@/lib/guest-store/store";
import type { ExpenseFormValues } from "@/lib/schemas/budget";
import type { PaymentStatus } from "@/lib/types/database";

export default function GuestSuppliersPage() {
  const router = useRouter();
  const wedding = useGuestStore((s) => s.wedding);
  const vendors = useGuestStore((s) => s.vendors);
  const expenses = useGuestStore((s) => s.expenses);
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

  const usedCategories = [...new Set(vendors.map((v) => v.category))];
  const tabCategories = ["all", ...usedCategories];
  const currency = wedding.currency;
  const totals = summariseVendorFinances(vendors, expenses);
  const remaining = Math.max(0, totals.actual - totals.paid);

  function vendorCardProps(vendorId: string) {
    return {
      weddingId: "guest" as const,
      currency,
      expenses,
      categories,
      onEditSubmit: async (data: Parameters<typeof updateVendor>[1], existing?: { id: string }) => {
        if (existing) updateVendor(existing.id, data);
        return { ok: true as const };
      },
      onDelete: async (id: string) => { deleteVendor(id); return { ok: true as const }; },
      onAddExpense: async (data: ExpenseFormValues) => { createExpense(data); return { ok: true as const }; },
      onUpdateExpense: async (id: string, data: ExpenseFormValues) => { updateExpense(id, data); return { ok: true as const }; },
      onDeleteExpense: async (id: string) => { deleteExpense(id); return { ok: true as const }; },
      onUpdateExpenseStatus: async (id: string, status: PaymentStatus) => {
        updateExpense(id, { payment_status: status });
        return { ok: true as const };
      },
    };
  }

  return (
    <GuestAppShell>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-serif text-2xl font-semibold">Suppliers</h1>
            <p className="text-sm text-muted-foreground">{vendors.length} vendors tracked</p>
          </div>
          <VendorFormDialog
            weddingId="guest"
            onSubmit={async (data) => { createVendor(data); return { ok: true }; }}
            trigger={<Button size="sm"><Plus className="mr-1.5 h-3.5 w-3.5" />Add Supplier</Button>}
          />
        </div>

        {vendors.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Planned",     value: totals.planned, icon: PiggyBank,    color: "text-sky-600" },
              { label: "Actual",      value: totals.actual,  icon: Wallet,       color: "text-primary" },
              { label: "Paid",        value: totals.paid,    icon: CheckCircle2, color: "text-emerald-600" },
              { label: "Outstanding", value: remaining,      icon: Wallet,       color: "text-amber-600" },
            ].map(({ label, value, icon: Icon, color }) => (
              <Card key={label}>
                <CardContent className="flex items-center gap-3 p-4">
                  <Icon className={`h-5 w-5 shrink-0 ${color}`} />
                  <div>
                    <p className="text-lg font-bold">{formatCurrency(value, currency)}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {vendors.length === 0 ? (
          <EmptyState
            icon={Store}
            title="No suppliers yet"
            description="Add your vendors — venue, caterer, photographer, and more."
            action={
              <VendorFormDialog
                weddingId="guest"
                onSubmit={async (data) => { createVendor(data); return { ok: true }; }}
                trigger={<Button><Plus className="mr-1.5 h-4 w-4" />Add Supplier</Button>}
              />
            }
          />
        ) : (
          <Tabs defaultValue="all">
            <TabsList className="flex flex-wrap h-auto gap-1 bg-transparent p-0">
              {tabCategories.map((cat) => (
                <TabsTrigger
                  key={cat}
                  value={cat}
                  className="rounded-full border border-border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary px-3 py-1 text-xs font-medium"
                >
                  {cat === "all" ? "All" : capitalize(cat)}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {vendors.map((v) => (
                  <VendorCard key={v.id} vendor={v} {...vendorCardProps(v.id)} />
                ))}
              </div>
            </TabsContent>

            {usedCategories.map((cat) => (
              <TabsContent key={cat} value={cat} className="mt-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {vendors.filter((v) => v.category === cat).map((v) => (
                    <VendorCard key={v.id} vendor={v} {...vendorCardProps(v.id)} />
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </GuestAppShell>
  );
}
