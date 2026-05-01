import { createClient } from "@/lib/supabase/server";
import { requireWeddingMember } from "@/lib/auth";
import type { Wedding, BudgetCategory, Expense, Vendor } from "@/lib/types/database";
import { BudgetSummary } from "@/components/BudgetSummary";
import { BudgetChart } from "@/components/BudgetChart";
import { BudgetCategoriesCard } from "@/components/BudgetCategoriesCard";
import { CategoryFormDialog } from "@/components/CategoryFormDialog";
import { ExpenseFormDialog } from "@/components/ExpenseFormDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PiggyBank, Plus, Pencil, Trash2 } from "lucide-react";
import { formatCurrency, formatDate, capitalize } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { deleteBudgetCategory, deleteExpense } from "@/lib/actions/budget";

const paymentColors: Record<string, "secondary" | "warning" | "info" | "success"> = {
  unpaid: "secondary",
  deposit_paid: "info",
  partially_paid: "warning",
  paid: "success",
};

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

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Planned vs Actual</CardTitle></CardHeader>
              <CardContent>
                <BudgetChart categories={allCategories} currency={currency} />
              </CardContent>
            </Card>
            <BudgetCategoriesCard
              categories={allCategories}
              currency={currency}
              weddingId={weddingId}
            />
          </div>

          {/* Expenses table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Expenses</CardTitle>
              <ExpenseFormDialog
                weddingId={weddingId}
                categories={allCategories}
                vendors={allVendors as { id: string; name: string }[]}
                trigger={<Button size="sm"><Plus className="mr-1.5 h-3.5 w-3.5" />Add</Button>}
              />
            </CardHeader>
            <CardContent>
              {allExpenses.length === 0 ? (
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
                      {allExpenses.map((exp) => {
                        const cat = allCategories.find((c) => c.id === exp.category_id);
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
                                  weddingId={weddingId}
                                  expense={exp}
                                  categories={allCategories}
                                  vendors={allVendors as { id: string; name: string }[]}
                                  trigger={<Button variant="ghost" size="icon" className="h-7 w-7"><Pencil className="h-3.5 w-3.5" /></Button>}
                                />
                                <ConfirmDialog
                                  trigger={<Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>}
                                  title="Delete expense"
                                  description={`Delete "${exp.title}"?`}
                                  onConfirm={async () => { "use server"; await deleteExpense(weddingId, exp.id); }}
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
  );
}
