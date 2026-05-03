"use client";

import { useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, Store, PiggyBank, FileText, CheckCircle2 } from "lucide-react";
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

  return (
    <GuestAppShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Here&apos;s your wedding at a glance</p>
        </div>

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
