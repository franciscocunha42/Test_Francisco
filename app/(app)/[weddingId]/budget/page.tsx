import { createClient } from "@/lib/supabase/server";
import { requireWeddingMember } from "@/lib/auth";
import type { Wedding, BudgetCategory, Expense, Vendor } from "@/lib/types/database";
import { BudgetSummary } from "@/components/BudgetSummary";
import { BudgetView } from "@/components/BudgetView";
import { BudgetNotSetBanner } from "@/components/BudgetNotSetBanner";
import { CategoryFormDialog } from "@/components/CategoryFormDialog";
import { ExpenseFormDialog } from "@/components/ExpenseFormDialog";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { PiggyBank, Plus } from "lucide-react";

export default async function BudgetPage({ params }: { params: { weddingId: string } }) {
  const { weddingId } = params;
  await requireWeddingMember(weddingId);
  const supabase = createClient();

  const [weddingRes, categoriesRes, expensesRes, vendorsRes] = await Promise.all([
    supabase.from("weddings").select("*").eq("id", weddingId).single(),
    supabase.from("budget_categories").select("*").eq("wedding_id", weddingId).order("name"),
    supabase.from("expenses").select("*").eq("wedding_id", weddingId).order("created_at"),
    supabase.from("vendors").select("id, name").eq("wedding_id", weddingId),
  ]);

  const wedding = weddingRes.data as Wedding | null;
  const allCategories = (categoriesRes.data ?? []) as BudgetCategory[];
  const allExpenses = (expensesRes.data ?? []) as Expense[];
  const allVendors = (vendorsRes.data ?? []) as Pick<Vendor, "id" | "name">[];
  const currency = wedding?.currency ?? "USD";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold">Budget</h1>
          <p className="text-sm text-muted-foreground">Track planned vs actual wedding costs</p>
        </div>
        <div className="flex gap-2">
          <CategoryFormDialog weddingId={weddingId} trigger={<Button variant="outline" size="sm"><Plus className="mr-1.5 h-3.5 w-3.5" />Category</Button>} />
          <ExpenseFormDialog
            weddingId={weddingId}
            categories={allCategories}
            vendors={allVendors as { id: string; name: string }[]}
            trigger={<Button size="sm"><Plus className="mr-1.5 h-3.5 w-3.5" />Expense</Button>}
          />
        </div>
      </div>

      {wedding && (wedding.total_budget ?? 0) === 0 && (
        <BudgetNotSetBanner wedding={wedding} weddingId={weddingId} />
      )}

      {allCategories.length === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title="No budget categories yet"
          description="Create categories like Venue, Catering, Photography to start tracking spending."
          action={<CategoryFormDialog weddingId={weddingId} trigger={<Button><Plus className="mr-1.5 h-4 w-4" />Add Category</Button>} />}
        />
      ) : (
        <>
          <BudgetSummary totalBudget={wedding?.total_budget ?? 0} categories={allCategories} currency={currency} />

          <BudgetView
            weddingId={weddingId}
            categories={allCategories}
            expenses={allExpenses}
            vendors={allVendors as { id: string; name: string }[]}
            currency={currency}
            totalBudget={wedding?.total_budget ?? 0}
          />
        </>
      )}
    </div>
  );
}
