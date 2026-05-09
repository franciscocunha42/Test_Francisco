import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireWeddingMember } from "@/lib/auth";
import type { Wedding, TimelineTask, Guest, Vendor, BudgetCategory, Expense } from "@/lib/types/database";
import { formatDate } from "@/lib/utils/format";
import { DashboardStatTiles } from "@/components/DashboardStatTiles";
import { BudgetDonutChart } from "@/components/BudgetDonutChart";
import { BudgetVendorBreakdownTable } from "@/components/BudgetVendorBreakdownTable";
import { WeddingHeaderEditor } from "@/components/WeddingHeaderEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

function isOverdue(task: TimelineTask): boolean {
  if (!task.due_date) return false;
  return task.due_date < new Date().toISOString().split("T")[0];
}

export default async function DashboardPage({ params }: { params: { weddingId: string } }) {
  const { weddingId } = params;
  await requireWeddingMember(weddingId);
  const supabase = createClient();

  const [weddingRes, tasksRes, guestsRes, vendorsRes, categoriesRes, expensesRes] = await Promise.all([
    supabase.from("weddings").select("*").eq("id", weddingId).single(),
    supabase.from("timeline_tasks").select("*").eq("wedding_id", weddingId).order("due_date"),
    supabase.from("guests").select("*").eq("wedding_id", weddingId),
    supabase.from("vendors").select("*").eq("wedding_id", weddingId).order("created_at", { ascending: false }),
    supabase.from("budget_categories").select("*").eq("wedding_id", weddingId),
    supabase.from("expenses").select("vendor_id, planned_amount, actual_amount, payment_status").eq("wedding_id", weddingId),
  ]);

  const wedding = weddingRes.data as Wedding | null;
  const tasks = (tasksRes.data ?? []) as TimelineTask[];
  const guests = (guestsRes.data ?? []) as Guest[];
  const vendors = (vendorsRes.data ?? []) as Vendor[];
  const categories = (categoriesRes.data ?? []) as BudgetCategory[];
  const expenses = (expensesRes.data ?? []) as Pick<Expense, "vendor_id" | "planned_amount" | "actual_amount" | "payment_status">[];

  const currency = wedding?.currency ?? "USD";
  const totalBudget = wedding?.total_budget ?? 0;
  const totalSpent = categories.reduce((s, c) => s + (c.actual_amount ?? 0), 0);
  const guestsAttending = guests.filter((g) => g.rsvp_status === "attending").length;

  // Upcoming: overdue first, then future — both sorted by due_date asc
  const pendingTasks = tasks.filter((t) => t.status !== "completed" && t.due_date);
  const overdueTasks = pendingTasks.filter(isOverdue);
  const futureTasks = pendingTasks.filter((t) => !isOverdue(t));
  const upcomingTasks = [...overdueTasks, ...futureTasks].slice(0, 7);

  return (
    <div className="space-y-6">
      {wedding && (
        <WeddingHeaderEditor wedding={wedding} weddingId={weddingId} />
      )}

      <DashboardStatTiles
        totalBudget={totalBudget}
        spentSoFar={totalSpent}
        guestsAttending={guestsAttending}
        guestsTotal={guests.length}
        currency={currency}
      />

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Expenses by Category</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/${weddingId}/budget`}>View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <BudgetDonutChart categories={categories} currency={currency} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Vendor Spending</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/${weddingId}/suppliers`}>View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <BudgetVendorBreakdownTable
              vendors={vendors}
              expenses={expenses}
              currency={currency}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Upcoming Tasks</CardTitle>
            {overdueTasks.length > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                <AlertCircle className="h-3 w-3" />
                {overdueTasks.length} overdue
              </span>
            )}
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/${weddingId}/timeline`}>View all</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {upcomingTasks.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No upcoming tasks</p>
          ) : (
            upcomingTasks.map((t) => {
              const overdue = isOverdue(t);
              return (
                <div
                  key={t.id}
                  className={`flex items-center justify-between rounded-md border px-3 py-2 text-sm ${overdue ? "border-destructive/40 bg-destructive/5" : ""}`}
                >
                  <span className={`truncate ${overdue ? "font-medium text-destructive" : ""}`}>{t.title}</span>
                  {t.due_date && (
                    <span className={`ml-2 shrink-0 text-xs ${overdue ? "font-medium text-destructive" : "text-muted-foreground"}`}>
                      {overdue && "Overdue · "}{formatDate(t.due_date)}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
