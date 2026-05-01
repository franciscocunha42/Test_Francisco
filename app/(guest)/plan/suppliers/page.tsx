"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Store, Plus } from "lucide-react";
import { GuestAppShell } from "@/components/GuestAppShell";
import { VendorCard } from "@/components/VendorCard";
import { VendorFormDialog } from "@/components/VendorFormDialog";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { capitalize } from "@/lib/utils/format";
import { useGuestStore } from "@/lib/guest-store/store";

export default function GuestSuppliersPage() {
  const router = useRouter();
  const wedding = useGuestStore((s) => s.wedding);
  const vendors = useGuestStore((s) => s.vendors);
  const createVendor = useGuestStore((s) => s.createVendor);
  const updateVendor = useGuestStore((s) => s.updateVendor);
  const deleteVendor = useGuestStore((s) => s.deleteVendor);

  useEffect(() => {
    if (!wedding) router.replace("/plan");
  }, [wedding, router]);

  if (!wedding) return null;

  const usedCategories = [...new Set(vendors.map((v) => v.category))];
  const tabCategories = ["all", ...usedCategories];
  const currency = wedding.currency;

  const renderTrigger = (label = "Add Supplier") => (
    <VendorFormDialog
      weddingId="guest"
      onSubmit={async (data) => { createVendor(data); return { ok: true }; }}
      trigger={<Button size="sm"><Plus className="mr-1.5 h-3.5 w-3.5" />{label}</Button>}
    />
  );

  return (
    <GuestAppShell>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl font-semibold">Suppliers</h1>
            <p className="text-sm text-muted-foreground">{vendors.length} vendors tracked</p>
          </div>
          {renderTrigger()}
        </div>

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
                  <VendorCard
                    key={v.id}
                    vendor={v}
                    weddingId="guest"
                    currency={currency}
                    onEditSubmit={async (data, existing) => {
                      if (existing) updateVendor(existing.id, data);
                      return { ok: true };
                    }}
                    onDelete={async (id) => { deleteVendor(id); return { ok: true }; }}
                  />
                ))}
              </div>
            </TabsContent>

            {usedCategories.map((cat) => (
              <TabsContent key={cat} value={cat} className="mt-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {vendors.filter((v) => v.category === cat).map((v) => (
                    <VendorCard
                      key={v.id}
                      vendor={v}
                      weddingId="guest"
                      currency={currency}
                      onEditSubmit={async (data, existing) => {
                        if (existing) updateVendor(existing.id, data);
                        return { ok: true };
                      }}
                      onDelete={async (id) => { deleteVendor(id); return { ok: true }; }}
                    />
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
