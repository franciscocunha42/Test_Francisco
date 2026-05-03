import { createClient } from "@/lib/supabase/server";
import { requireWeddingMember } from "@/lib/auth";
import type { Vendor, Expense } from "@/lib/types/database";
import { VendorCard } from "@/components/VendorCard";
import { VendorFormDialog } from "@/components/VendorFormDialog";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Store, Plus, PiggyBank, Wallet, CheckCircle2 } from "lucide-react";
import { capitalize, formatCurrency } from "@/lib/utils/format";
import { summariseVendorFinances } from "@/lib/utils/vendor-finance";

export default async function SuppliersPage({ params }: { params: { weddingId: string } }) {
  const { weddingId } = params;
  await requireWeddingMember(weddingId);
  const supabase = createClient();

  const [vendorsRes, expensesRes, weddingRes] = await Promise.all([
    supabase.from("vendors").select("*").eq("wedding_id", weddingId).order("created_at"),
    supabase.from("expenses").select("vendor_id, planned_amount, actual_amount, payment_status").eq("wedding_id", weddingId),
    supabase.from("weddings").select("currency").eq("id", weddingId).single(),
  ]);

  const allVendors = (vendorsRes.data ?? []) as Vendor[];
  const expenses = (expensesRes.data ?? []) as Pick<Expense, "vendor_id" | "planned_amount" | "actual_amount" | "payment_status">[];
  const currency = (weddingRes.data as { currency: string } | null)?.currency ?? "USD";
  const usedCategories = [...new Set(allVendors.map((v) => v.category))];
  const tabCategories = ["all", ...usedCategories];

  const totals = summariseVendorFinances(allVendors, expenses);
  const remaining = Math.max(0, totals.actual - totals.paid);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-2xl font-semibold">Suppliers</h1>
          <p className="text-sm text-muted-foreground">{allVendors.length} vendors tracked</p>
        </div>
        <VendorFormDialog
          weddingId={weddingId}
          trigger={<Button size="sm"><Plus className="mr-1.5 h-3.5 w-3.5" />Add Supplier</Button>}
        />
      </div>

      {allVendors.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Planned",   value: totals.planned, icon: PiggyBank,    color: "text-sky-600" },
            { label: "Actual",    value: totals.actual,  icon: Wallet,       color: "text-primary" },
            { label: "Paid",      value: totals.paid,    icon: CheckCircle2, color: "text-emerald-600" },
            { label: "Outstanding", value: remaining,    icon: Wallet,       color: "text-amber-600" },
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

      {allVendors.length === 0 ? (
        <EmptyState
          icon={Store}
          title="No suppliers yet"
          description="Add your vendors — venue, caterer, photographer, and more."
          action={<VendorFormDialog weddingId={weddingId} trigger={<Button><Plus className="mr-1.5 h-4 w-4" />Add Supplier</Button>} />}
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
              {allVendors.map((v) => <VendorCard key={v.id} vendor={v} weddingId={weddingId} currency={currency} expenses={expenses} />)}
            </div>
          </TabsContent>

          {usedCategories.map((cat) => (
            <TabsContent key={cat} value={cat} className="mt-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {allVendors.filter((v) => v.category === cat).map((v) => (
                  <VendorCard key={v.id} vendor={v} weddingId={weddingId} currency={currency} expenses={expenses} />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
