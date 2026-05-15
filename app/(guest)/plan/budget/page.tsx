"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PiggyBank, Plus } from "lucide-react";
import { GuestAppShell } from "@/components/GuestAppShell";
import { BudgetSummary } from "@/components/BudgetSummary";
import { BudgetView } from "@/components/BudgetView";
import { BudgetNotSetBanner } from "@/components/BudgetNotSetBanner";
import { CategoryFormDialog } from "@/components/CategoryFormDialog";
import { ExpenseFormDialog } from "@/components/ExpenseFormDialog";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { useGuestStore } from "@/lib/guest-store/store";
import { scaleDefaultCategories } from "@/lib/utils/default-budget";
import type { Wedding } from "@/lib/types/database";

export default function GuestBudgetPage() {
  const router = useRouter();
  const wedding = useGuestStore((s) => s.wedding);
  const categories = useGuestStore((s) => s.budgetCategories);
  const expenses = useGuestStore((s) => s.expenses);
  const vendors = useGuestStore((s) => s.vendors);
  const createCategory = useGuestStore((s) => s.createBudgetCategory);
  const updateCategory = useGuestStore((s) => s.updateBudgetCategory);
  const deleteCategory = useGuestStore((s) => s.deleteBudgetCategory);
  const createExpense = useGuestStore((s) => s.createExpense);
  const updateExpense = useGuestStore((s) => s.updateExpense);
  const deleteExpense = useGuestStore((s) => s.deleteExpense);

  useEffect(() => {
    if (!wedding) router.replace("/plan");
  }, [wedding, router]);

  if (!wedding) return null;

  const currency = wedding.currency;
  const vendorOptions = vendors.map((v) => ({ id: v.id, name: v.name }));

  async function handleSetBudget(totalBudget: number, currency: string) {
    if (!wedding) return { ok: false, error: "No wedding loaded" };
    const updateWedding = useGuestStore.getState().updateWedding;
    const updateCategoryFn = useGuestStore.getState().updateBudgetCategory;
    const createCategoryFn = useGuestStore.getState().createBudgetCategory;
    updateWedding({ total_budget: totalBudget, currency });
    const split = scaleDefaultCategories(totalBudget);
    const byName = new Map(useGuestStore.getState().budgetCategories.map((c) => [c.name, c.id]));
    for (const item of split) {
      const id = byName.get(item.name);
      if (id) updateCategoryFn(id, { planned_amount: item.planned_amount });
      else createCategoryFn({ name: item.name, planned_amount: item.planned_amount });
    }
    return { ok: true };
  }

  return (
    <GuestAppShell>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl font-semibold">Budget</h1>
            <p className="text-sm text-muted-foreground">Track planned vs actual wedding costs</p>
          </div>
          <div className="flex gap-2">
            <CategoryFormDialog
              weddingId="guest"
              onSubmit={async (data) => { createCategory(data); return { ok: true }; }}
              trigger={<Button variant="outline" size="sm"><Plus className="mr-1.5 h-3.5 w-3.5" />Category</Button>}
            />
            <ExpenseFormDialog
              weddingId="guest"
              categories={categories}
              vendors={vendorOptions}
              onSubmit={async (data) => { createExpense(data); return { ok: true }; }}
              trigger={<Button size="sm"><Plus className="mr-1.5 h-3.5 w-3.5" />Expense</Button>}
            />
          </div>
        </div>

        {(wedding.total_budget ?? 0) === 0 && (
          <BudgetNotSetBanner wedding={wedding as Wedding} weddingId="guest" onSubmit={handleSetBudget} />
        )}

        {categories.length === 0 ? (
          <EmptyState
            icon={PiggyBank}
            title="No budget categories yet"
            description="Create categories like Venue, Catering, Photography to start tracking spending."
            action={
              <CategoryFormDialog
                weddingId="guest"
                onSubmit={async (data) => { createCategory(data); return { ok: true }; }}
                trigger={<Button><Plus className="mr-1.5 h-4 w-4" />Add Category</Button>}
              />
            }
          />
        ) : (
          <>
            <BudgetSummary totalBudget={wedding.total_budget} categories={categories} currency={currency} />

            <BudgetView
              weddingId="guest"
              categories={categories}
              expenses={expenses}
              vendors={vendorOptions}
              currency={currency}
              totalBudget={wedding.total_budget ?? 0}
              onSubmitCategory={async (data, existing) => {
                if (existing) { updateCategory(existing.id, data); return { ok: true }; }
                createCategory(data);
                return { ok: true };
              }}
              onDeleteCategory={(id) => deleteCategory(id)}
              onSubmitExpense={async (data, existing) => {
                if (existing) { updateExpense(existing.id, data); return { ok: true }; }
                createExpense(data);
                return { ok: true };
              }}
              onDeleteExpense={(id) => deleteExpense(id)}
            />
          </>
        )}
      </div>
    </GuestAppShell>
  );
}
