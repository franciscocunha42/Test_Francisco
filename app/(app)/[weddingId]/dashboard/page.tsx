import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireWeddingMember, getUserWeddings } from "@/lib/auth";
import type { Wedding, TimelineTask, Guest, Vendor, BudgetCategory } from "@/lib/types/database";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { CountdownCard } from "@/components/CountdownCard";
import { DashboardCard } from "@/components/DashboardCard";
import { RsvpSummaryCard } from "@/components/RsvpSummaryCard";
import { BudgetChart } from "@/components/BudgetChart";
import { WeddingSwitcher } from "@/components/WeddingSwitcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Store, PiggyBank, FileText, Plus, CheckCircle2, MapPin, Heart } from "lucide-react";
import { GuestFormDialog } from "@/components/GuestFormDialog";
import { VendorFormDialog } from "@/components/VendorFormDialog";
import { TaskFormDialog } from "@/components/TaskFormDialog";

export default async function DashboardPage({ params }: { params: { weddingId: string } }) {
  const { weddingId } = params;
  await requireWeddingMember(weddingId);
  const supabase = createClient();

  const [weddingRes, tasksRes, guestsRes, vendorsRes, categoriesRes, memberships] = await Promise.all([
    supabase.from("weddings").select("*").eq("id", weddingId).single(),
    supabase.from("timeline_tasks").select("*").eq("wedding_id", weddingId).order("due_date"),
    supabase.from("guests").select("*").eq("wedding_id", weddingId),
    supabase.from("vendors").select("*").eq("wedding_id", weddingId).order("created_at", { ascending: false }),
    supabase.from("budget_categories").select("*").eq("wedding_id", weddingId),
    getUserWeddings(),
  ]);

  const wedding = weddingRes.data as Wedding | null;
  const tasks = tasksRes.data as TimelineTask[] | null;
  const guests = guestsRes.data as Guest[] | null;
  const vendors = vendorsRes.data as Vendor[] | null;
  const categories = categoriesRes.data as BudgetCategory[] | null;

  const allTasks = tasks ?? [];
  const completedTasks = allTasks.filter((t) => t.status === "completed").length;
  const taskPct = allTasks.length > 0 ? Math.round((completedTasks / allTasks.length) * 100) : 0;

  const allGuests = guests ?? [];
  const allVendors = vendors ?? [];
  const allCategories = categories ?? [];
  const allWeddings = memberships.map((m) => m.weddings as unknown as Pick<Wedding, "id" | "name" | "wedding_date">);

  const totalActual = allCategories.reduce((s, c) => s + (c.actual_amount ?? 0), 0);
  const remaining = (wedding?.total_budget ?? 0) - totalActual;

  const upcomingTasks = allTasks
    .filter((t) => t.status !== "completed" && t.due_date)
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
    .slice(0, 5);

  const recentVendors = allVendors.filter((v) => v.status === "booked").slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Wedding info header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary fill-primary" />
            <h1 className="font-serif text-2xl font-semibold">{wedding?.name ?? "Dashboard"}</h1>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {wedding?.partner_one_name && wedding?.partner_two_name && (
              <span>{wedding.partner_one_name} &amp; {wedding.partner_two_name}</span>
            )}
            {wedding?.wedding_date && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(wedding.wedding_date)}
              </span>
            )}
            {(wedding?.venue_name || wedding?.location) && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {wedding.venue_name ?? wedding.location}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <WeddingSwitcher currentWeddingId={weddingId} weddings={allWeddings} />
          <Button variant="outline" size="sm" asChild>
            <Link href={`/${weddingId}/settings`}>Edit wedding</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <CountdownCard weddingDate={wedding?.wedding_date ?? null} weddingName={wedding?.name ?? ""} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:col-span-2">
          <DashboardCard
            title="Total Budget"
            value={formatCurrency(wedding?.total_budget ?? 0, wedding?.currency ?? "USD")}
            icon={PiggyBank}
          />
          <DashboardCard
            title="Total Spent"
            value={formatCurrency(totalActual, wedding?.currency ?? "USD")}
            icon={PiggyBank}
          />
          <DashboardCard
            title="Remaining"
            value={formatCurrency(Math.abs(remaining), wedding?.currency ?? "USD")}
            subtitle={remaining < 0 ? "Over budget" : "Available"}
            icon={PiggyBank}
          />
          <DashboardCard
            title="Tasks Complete"
            value={`${taskPct}%`}
            subtitle={`${completedTasks} / ${allTasks.length} tasks`}
            icon={CheckCircle2}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <RsvpSummaryCard guests={allGuests} />
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Budget Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {allCategories.length > 0 ? (
              <BudgetChart categories={allCategories} currency={wedding?.currency ?? "USD"} />
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
            <Button variant="ghost" size="sm" asChild><Link href={`/${weddingId}/timeline`}>View all</Link></Button>
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Booked Suppliers</CardTitle>
            <Button variant="ghost" size="sm" asChild><Link href={`/${weddingId}/suppliers`}>View all</Link></Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentVendors.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No booked suppliers yet</p>
            ) : (
              recentVendors.map((v) => (
                <div key={v.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <span className="truncate">{v.name}</span>
                  <Badge variant="success" className="ml-2 shrink-0 text-xs">Booked</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <GuestFormDialog weddingId={weddingId} trigger={<Button variant="outline" size="sm"><Users className="mr-1.5 h-3.5 w-3.5" />Add Guest</Button>} />
            <VendorFormDialog weddingId={weddingId} trigger={<Button variant="outline" size="sm"><Store className="mr-1.5 h-3.5 w-3.5" />Add Supplier</Button>} />
            <TaskFormDialog weddingId={weddingId} trigger={<Button variant="outline" size="sm"><Calendar className="mr-1.5 h-3.5 w-3.5" />Add Task</Button>} />
            <Button variant="outline" size="sm" asChild>
              <Link href={`/${weddingId}/forms`}><FileText className="mr-1.5 h-3.5 w-3.5" />Create Form</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
