import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireWeddingMember, getUserWeddings } from "@/lib/auth";
import type { Wedding, TimelineTask, Guest, Vendor, BudgetCategory, Expense } from "@/lib/types/database";
import { DashboardStatTiles } from "@/components/DashboardStatTiles";
import { BudgetDonutChart } from "@/components/BudgetDonutChart";
import { BudgetVendorBreakdownTable } from "@/components/BudgetVendorBreakdownTable";
import { TimelineGantt } from "@/components/TimelineGantt";
import { WeddingHeaderEditor } from "@/components/WeddingHeaderEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage({ params }: { params: { weddingId: string } }) {
  const { weddingId } = params;
  await requireWeddingMember(weddingId);
  const supabase = createClient();

  const [weddingRes, tasksRes, guestsRes, vendorsRes, categoriesRes, expensesRes, memberships] = await Promise.all([
    supabase.from("weddings").select("*").eq("id", weddingId).single(),
    supabase.from("timeline_tasks").select("*").eq("wedding_id", weddingId).order("due_date"),
    supabase.from("guests").select("*").eq("wedding_id", weddingId),
    supabase.from("vendors").select("*").eq("wedding_id", weddingId).order("created_at", { ascending: false }),
    supabase.from("budget_categories").select("*").eq("wedding_id", weddingId),
    supabase.from("expenses").select("vendor_id, planned_amount, actual_amount, payment_status").eq("wedding_id", weddingId),
    getUserWeddings(),
  ]);

  const wedding = weddingRes.data as Wedding | null;
  const tasks = (tasksRes.data ?? []) as TimelineTask[];
  const guests = (guestsRes.data ?? []) as Guest[];
  const vendors = (vendorsRes.data ?? []) as Vendor[];
  const categories = (categoriesRes.data ?? []) as BudgetCategory[];
  const expenses = (expensesRes.data ?? []) as Pick<Expense, "vendor_id" | "planned_amount" | "actual_amount" | "payment_status">[];
  const allWeddings = memberships.map((m) => m.weddings as unknown as Pick<Wedding, "id" | "name" | "wedding_date">);

  const currency = wedding?.currency ?? "USD";
  const totalBudget = wedding?.total_budget ?? 0;
  const totalSpent = categories.reduce((s, c) => s + (c.actual_amount ?? 0), 0);
  const guestsAttending = guests.filter((g) => g.rsvp_status === "attending").length;

  return (
    <div className="space-y-6">
      {wedding && (
        <WeddingHeaderEditor
          wedding={wedding}
          weddingId={weddingId}
          allWeddings={allWeddings}
        />
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
          <CardTitle className="text-base">Wedding Timeline</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/${weddingId}/timeline`}>View all</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <TimelineGantt tasks={tasks} weddingDate={wedding?.wedding_date ?? null} />
        </CardContent>
      </Card>
    </div>
  );
}
