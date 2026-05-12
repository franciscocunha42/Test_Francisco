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
import { WeddingDetailsDialog } from "@/components/WeddingDetailsDialog";
import type { WeddingDetailsInput } from "@/components/WeddingDetailsDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, Heart, Pencil, AlertCircle } from "lucide-react";
import { useT } from "@/lib/i18n/provider";

export default function GuestDashboardPage() {
  const router = useRouter();
  const t = useT();
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

  const today = new Date().toISOString().split("T")[0];
  const pendingTasks = tasks.filter((t) => t.status !== "completed" && t.due_date);
  const overdueTasks = pendingTasks.filter((t) => t.due_date! < today);
  const futureTasks = pendingTasks.filter((t) => t.due_date! >= today);
  const upcomingTasks = [...overdueTasks, ...futureTasks].slice(0, 7);

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
                aria-label={t("common.edit")}
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
                {t("dashboard.addNamesPrompt")}
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
              <CardTitle className="text-base">{t("dashboard.expensesByCategory")}</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/plan/budget">{t("common.viewAll")}</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <BudgetDonutChart categories={categories} currency={wedding.currency} />
            </CardContent>
          </Card>
          <Card className="lg:col-span-3">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">{t("dashboard.vendorSpending")}</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/plan/suppliers">{t("common.viewAll")}</Link>
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
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">{t("dashboard.upcomingTasks")}</CardTitle>
              {overdueTasks.length > 0 && (
                <span className="flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                  <AlertCircle className="h-3 w-3" />
                  {overdueTasks.length} {t("dashboard.overdue")}
                </span>
              )}
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/plan/timeline">{t("common.viewAll")}</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {upcomingTasks.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">{t("dashboard.noUpcomingTasks")}</p>
            ) : (
              upcomingTasks.map((task) => {
                const overdue = task.due_date! < today;
                return (
                  <div
                    key={task.id}
                    className={`flex items-center justify-between rounded-md border px-3 py-2 text-sm ${overdue ? "border-destructive/40 bg-destructive/5" : ""}`}
                  >
                    <span className={`truncate ${overdue ? "font-medium text-destructive" : ""}`}>{task.title}</span>
                    {task.due_date && (
                      <span className={`ml-2 shrink-0 text-xs ${overdue ? "font-medium text-destructive" : "text-muted-foreground"}`}>
                        {overdue && t("dashboard.overduePrefix")}{formatDate(task.due_date)}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </GuestAppShell>
  );
}
