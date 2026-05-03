"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGuestStore } from "@/lib/guest-store/store";
import { GuestAppShell } from "@/components/GuestAppShell";
import { formatDate } from "@/lib/utils/format";
import { DashboardStatTiles } from "@/components/DashboardStatTiles";
import { BudgetDonutChart } from "@/components/BudgetDonutChart";
import { BudgetVendorBreakdownTable } from "@/components/BudgetVendorBreakdownTable";
import { TimelineGantt } from "@/components/TimelineGantt";
import { WeddingDetailsDialog } from "@/components/WeddingDetailsDialog";
import type { WeddingDetailsInput } from "@/components/WeddingDetailsDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, Heart, Pencil } from "lucide-react";

export default function GuestDashboardPage() {
  const router = useRouter();
  const wedding = useGuestStore((s) => s.wedding);
  const tasks = useGuestStore((s) => s.tasks);
  const guests = useGuestStore((s) => s.guests);
  const vendors = useGuestStore((s) => s.vendors);
  const expenses = useGuestStore((s) => s.expenses);
  const categories = useGuestStore((s) => s.budgetCategories);
  const updateWedding = useGuestStore((s) => s.updateWedding);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (!wedding) router.replace("/plan");
  }, [wedding, router]);

  if (!wedding) return null;

  const totalSpent = categories.reduce((s, c) => s + (c.actual_amount ?? 0), 0);
  const guestsAttending = guests.filter((g) => g.rsvp_status === "attending").length;
  const isGeneric = !wedding.partner_one_name?.trim() && !wedding.partner_two_name?.trim();

  async function handleSaveDetails(data: WeddingDetailsInput) {
    updateWedding(data);
  }

  return (
    <GuestAppShell>
      <div className="space-y-6">
        {/* Wedding info header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary fill-primary" />
              <h1 className="font-serif text-2xl font-semibold">{wedding.name}</h1>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => setEditOpen(true)}
                aria-label="Edit wedding details"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </div>
            {isGeneric ? (
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="mt-1 text-sm text-primary hover:underline"
              >
                Add your names, date &amp; venue →
              </button>
            ) : (
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                {wedding.partner_one_name && wedding.partner_two_name && (
                  <span>{wedding.partner_one_name} &amp; {wedding.partner_two_name}</span>
                )}
                {wedding.wedding_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(wedding.wedding_date)}
                  </span>
                )}
                {(wedding.venue_name || wedding.location) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {wedding.venue_name ?? wedding.location}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <WeddingDetailsDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          defaultValues={wedding}
          onSave={handleSaveDetails}
        />

        <DashboardStatTiles
          totalBudget={wedding.total_budget ?? 0}
          spentSoFar={totalSpent}
          guestsAttending={guestsAttending}
          guestsTotal={guests.length}
          currency={wedding.currency}
        />

        <div className="grid gap-4 lg:grid-cols-5">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Expenses by Category</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/plan/budget">View all</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <BudgetDonutChart categories={categories} currency={wedding.currency} />
            </CardContent>
          </Card>
          <Card className="lg:col-span-3">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Vendor Spending</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/plan/suppliers">View all</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <BudgetVendorBreakdownTable
                vendors={vendors}
                expenses={expenses}
                currency={wedding.currency}
              />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Wedding Timeline</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/plan/timeline">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <TimelineGantt tasks={tasks} weddingDate={wedding.wedding_date ?? null} />
          </CardContent>
        </Card>
      </div>
    </GuestAppShell>
  );
}
