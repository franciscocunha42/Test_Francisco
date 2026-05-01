"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PiggyBank, Plus, Pencil, Trash2 } from "lucide-react";
import { GuestAppShell } from "@/components/GuestAppShell";
import { BudgetSummary } from "@/components/BudgetSummary";
import { BudgetSortableSection } from "@/components/BudgetSortableSection";
import { CategoryFormDialog } from "@/components/CategoryFormDialog";
import { ExpenseFormDialog } from "@/components/ExpenseFormDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, capitalize } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { useGuestStore } from "@/lib/guest-store/store";

const paymentColors: Record<string, "secondary" | "warning" | "info" | "success"> = {
  unpaid: "secondary",
  deposit_paid: "info",
  partially_paid: "warning",
  paid: "success",
};

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

            <BudgetSortableSection
              categories={categories}
              currency={currency}
              weddingId="guest"
              onSubmitCategory={async (data, existing) => {
                if (existing) { updateCategory(existing.id, data); return { ok: true }; }
                createCategory(data);
                return { ok: true };
              }}
              onDeleteCategory={(id) => deleteCategory(id)}
            />

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">Expenses</CardTitle>
                <ExpenseFormDialog
                  weddingId="guest"
                  categories={categories}
                  vendors={vendorOptions}
                  onSubmit={async (data) => { createExpense(data); return { ok: true }; }}
                  trigger={<Button size="sm"><Plus className="mr-1.5 h-3.5 w-3.5" />Add</Button>}
                />
              </CardHeader>
              <CardContent>
                {expenses.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">No expenses yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b">
                        <tr className="text-left text-muted-foreground">
                          <th className="pb-2 font-medium">Title</th>
                          <th className="pb-2 font-medium hidden sm:table-cell">Category</th>
                          <th className="pb-2 font-medium">Planned</th>
                          <th className="pb-2 font-medium">Actual</th>
                          <th className="pb-2 font-medium hidden md:table-cell">Status</th>
                          <th className="pb-2 font-medium hidden md:table-cell">Due</th>
                          <th className="w-16 pb-2" />
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {expenses.map((exp) => {
                          const cat = categories.find((c) => c.id === exp.category_id);
                          return (
                            <tr key={exp.id} className="hover:bg-muted/30">
                              <td className="py-2.5">{exp.title}</td>
                              <td className="py-2.5 hidden sm:table-cell text-muted-foreground">{cat?.name ?? "—"}</td>
                              <td className="py-2.5">{formatCurrency(exp.planned_amount, currency)}</td>
                              <td className={cn("py-2.5", exp.actual_amount > exp.planned_amount && "text-destructive")}>
                                {formatCurrency(exp.actual_amount, currency)}
                              </td>
                              <td className="py-2.5 hidden md:table-cell">
                                <Badge variant={paymentColors[exp.payment_status]}>{capitalize(exp.payment_status)}</Badge>
                              </td>
                              <td className="py-2.5 hidden md:table-cell text-muted-foreground text-xs">{formatDate(exp.due_date)}</td>
                              <td className="py-2.5">
                                <div className="flex justify-end gap-1">
                                  <ExpenseFormDialog
                                    weddingId="guest"
                                    expense={exp}
                                    categories={categories}
                                    vendors={vendorOptions}
                                    onSubmit={async (data, existing) => {
                                      if (existing) updateExpense(existing.id, data);
                                      return { ok: true };
                                    }}
                                    trigger={<Button variant="ghost" size="icon" className="h-7 w-7"><Pencil className="h-3.5 w-3.5" /></Button>}
                                  />
                                  <ConfirmDialog
                                    trigger={<Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>}
                                    title="Delete expense"
                                    description={`Delete "${exp.title}"?`}
                                    onConfirm={() => deleteExpense(exp.id)}
                                  />
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </GuestAppShell>
  );
}
