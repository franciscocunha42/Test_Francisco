"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGuestStore } from "@/lib/guest-store/store";
import { GuestAppShell } from "@/components/GuestAppShell";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { CountdownCard } from "@/components/CountdownCard";
import { DashboardCard } from "@/components/DashboardCard";
import { RsvpSummaryCard } from "@/components/RsvpSummaryCard";
import { BudgetChart } from "@/components/BudgetChart";
import { SuppliersOverviewCard } from "@/components/SuppliersOverviewCard";
import { WeddingDetailsDialog } from "@/components/WeddingDetailsDialog";
import type { WeddingDetailsInput } from "@/components/WeddingDetailsDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, Store, PiggyBank, FileText, CheckCircle2, MapPin, Heart, Pencil } from "lucide-react";
import { GuestFormDialog } from "@/components/GuestFormDialog";
import { VendorFormDialog } from "@/components/VendorFormDialog";
import { TaskFormDialog } from "@/components/TaskFormDialog";

export default function GuestDashboardPage() {
  const router = useRouter();
  const wedding = useGuestStore((s) => s.wedding);
  const tasks = useGuestStore((s) => s.tasks);
  const guests = useGuestStore((s) => s.guests);
  const vendors = useGuestStore((s) => s.vendors);
  const expenses = useGuestStore((s) => s.expenses);
  const categories = useGuestStore((s) => s.budgetCategories);
  const createTask = useGuestStore((s) => s.createTask);
  const createGuest = useGuestStore((s) => s.createGuest);
  const createVendor = useGuestStore((s) => s.createVendor);
  const updateWedding = useGuestStore((s) => s.updateWedding);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (!wedding) router.replace("/plan");
  }, [wedding, router]);

  if (!wedding) return null;

  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const taskPct = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
  const totalActual = categories.reduce((s, c) => s + (c.actual_amount ?? 0), 0);
  const remaining = (wedding.total_budget ?? 0) - totalActual;

  const upcomingTasks = tasks
    .filter((t) => t.status !== "completed" && t.due_date)
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
    .slice(0, 5);

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

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <CountdownCard weddingDate={wedding.wedding_date ?? null} weddingName={wedding.name} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:col-span-2">
            <DashboardCard title="Total Budget" value={formatCurrency(wedding.total_budget, wedding.currency)} icon={PiggyBank} />
            <DashboardCard title="Total Spent" value={formatCurrency(totalActual, wedding.currency)} icon={PiggyBank} />
            <DashboardCard
              title="Remaining"
              value={formatCurrency(Math.abs(remaining), wedding.currency)}
              subtitle={remaining < 0 ? "Over budget" : "Available"}
              icon={PiggyBank}
            />
            <DashboardCard
              title="Tasks Complete"
              value={`${taskPct}%`}
              subtitle={`${completedTasks} / ${tasks.length} tasks`}
              icon={CheckCircle2}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <RsvpSummaryCard guests={guests} />
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Budget Overview</CardTitle></CardHeader>
            <CardContent>
              {categories.length > 0 ? (
                <BudgetChart categories={categories} currency={wedding.currency} />
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">No budget categories yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Upcoming Tasks</CardTitle>
              <Button variant="ghost" size="sm" asChild><Link href="/plan/timeline">View all</Link></Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {upcomingTasks.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No upcoming tasks</p>
              ) : (
                upcomingTasks.map((t) => (
                  <div key={t.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                    <span className="truncate">{t.title}</span>
                    {t.due_date && <span className="ml-2 shrink-0 text-xs text-muted-foreground">{formatDate(t.due_date)}</span>}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
          <SuppliersOverviewCard
            vendors={vendors}
            expenses={expenses}
            currency={wedding.currency}
            href="/plan/suppliers"
          />
        </div>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <GuestFormDialog
                weddingId="guest"
                trigger={<Button variant="outline" size="sm"><Users className="mr-1.5 h-3.5 w-3.5" />Add Guest</Button>}
                onSubmit={async (data) => { createGuest(data); return { ok: true }; }}
              />
              <VendorFormDialog
                weddingId="guest"
                trigger={<Button variant="outline" size="sm"><Store className="mr-1.5 h-3.5 w-3.5" />Add Supplier</Button>}
                onSubmit={async (data) => { createVendor(data); return { ok: true }; }}
              />
              <TaskFormDialog
                weddingId="guest"
                trigger={<Button variant="outline" size="sm"><Calendar className="mr-1.5 h-3.5 w-3.5" />Add Task</Button>}
                onSubmit={async (data) => { createTask(data); return { ok: true }; }}
              />
              <Button variant="outline" size="sm" asChild>
                <Link href="/plan/forms"><FileText className="mr-1.5 h-3.5 w-3.5" />Create Form</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </GuestAppShell>
  );
}
