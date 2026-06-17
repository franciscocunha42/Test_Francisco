"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { BudgetSortableSection } from "@/components/BudgetSortableSection";
import { ExpenseFormDialog } from "@/components/ExpenseFormDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { capitalize, formatCurrency, formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { getCategoryEmoji } from "@/lib/utils/category-emojis";
import { deleteExpense as deleteExpenseAction } from "@/lib/actions/budget";
import { useT } from "@/lib/i18n/provider";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import type { BudgetCategory, Expense } from "@/lib/types/database";
import type { BudgetCategoryFormValues, ExpenseFormValues } from "@/lib/schemas/budget";

const paymentColors: Record<string, "secondary" | "warning" | "info" | "success"> = {
  unpaid: "secondary",
  deposit_paid: "info",
  partially_paid: "warning",
  paid: "success",
};

const PAYMENT_STATUS_KEYS: Record<string, TranslationKey> = {
  unpaid: "suppliers.paymentUnpaid",
  deposit_paid: "suppliers.paymentDepositPaid",
  partially_paid: "suppliers.paymentPartiallyPaid",
  paid: "suppliers.paymentPaid",
};

interface Props {
  weddingId: string;
  categories: BudgetCategory[];
  expenses: Expense[];
  vendors: { id: string; name: string }[];
  currency: string;
  onSubmitCategory?: (
    data: BudgetCategoryFormValues,
    existing?: BudgetCategory,
  ) => Promise<{ ok: boolean; error?: string }>;
  onDeleteCategory?: (id: string) => void;
  onSubmitExpense?: (
    data: ExpenseFormValues,
    existing?: Expense,
  ) => Promise<{ ok: boolean; error?: string }>;
  onDeleteExpense?: (id: string) => void;
}

export function BudgetView({
  weddingId,
  categories,
  expenses,
  vendors,
  currency,
  onSubmitCategory,
  onDeleteCategory,
  onSubmitExpense,
  onDeleteExpense,
}: Props) {
  const t = useT();
  const [filterId, setFilterId] = useState<string | null>(null);

  const toggleFilter = (id: string) =>
    setFilterId((prev) => (prev === id ? null : id));

  const selectedCategory = filterId ? categories.find((c) => c.id === filterId) : null;
  const filteredExpenses = filterId
    ? expenses.filter((e) => e.category_id === filterId)
    : expenses;

  return (
    <>
      <BudgetSortableSection
        categories={categories}
        currency={currency}
        weddingId={weddingId}
        onSubmitCategory={onSubmitCategory}
        onDeleteCategory={onDeleteCategory}
        selectedCategoryId={filterId}
        onCategoryToggle={toggleFilter}
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-base">{t("budget.expenses")}</CardTitle>
            {selectedCategory && (
              <button
                onClick={() => setFilterId(null)}
                className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium hover:bg-muted/70"
              >
                <span>{getCategoryEmoji(selectedCategory.name)}</span>
                {selectedCategory.name}
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <ExpenseFormDialog
            weddingId={weddingId}
            categories={categories}
            vendors={vendors}
            onSubmit={onSubmitExpense}
            trigger={
              <Button size="sm">
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                {t("common.add")}
              </Button>
            }
          />
        </CardHeader>
        <CardContent>
          {filteredExpenses.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {filterId ? t("budget.noExpensesCategory") : t("budget.noExpenses")}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr className="text-left text-muted-foreground">
                    <th className="pb-2 font-medium">{t("common.title")}</th>
                    <th className="pb-2 font-medium hidden sm:table-cell">{t("budget.expenseCategory")}</th>
                    <th className="pb-2 font-medium">{t("budget.planned")}</th>
                    <th className="pb-2 font-medium">{t("budget.actual")}</th>
                    <th className="pb-2 font-medium hidden md:table-cell">{t("common.status")}</th>
                    <th className="pb-2 font-medium hidden md:table-cell">{t("budget.colDue")}</th>
                    <th className="w-16 pb-2" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredExpenses.map((exp) => {
                    const cat = categories.find((c) => c.id === exp.category_id);
                    return (
                      <tr key={exp.id} className="hover:bg-muted/30">
                        <td className="py-2.5">{exp.title}</td>
                        <td className="py-2.5 hidden sm:table-cell text-muted-foreground">
                          {cat ? <>{getCategoryEmoji(cat.name)} {cat.name}</> : "—"}
                        </td>
                        <td className="py-2.5">{formatCurrency(exp.planned_amount, currency)}</td>
                        <td className={cn("py-2.5", exp.actual_amount > exp.planned_amount && "text-destructive")}>
                          {formatCurrency(exp.actual_amount, currency)}
                        </td>
                        <td className="py-2.5 hidden md:table-cell">
                          <Badge variant={paymentColors[exp.payment_status]}>{t((PAYMENT_STATUS_KEYS[exp.payment_status] ?? "suppliers.paymentUnpaid") as TranslationKey)}</Badge>
                        </td>
                        <td className="py-2.5 hidden md:table-cell text-muted-foreground text-xs">
                          {formatDate(exp.due_date)}
                        </td>
                        <td className="py-2.5">
                          <div className="flex justify-end gap-1">
                            <ExpenseFormDialog
                              weddingId={weddingId}
                              expense={exp}
                              categories={categories}
                              vendors={vendors}
                              onSubmit={onSubmitExpense}
                              trigger={
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              }
                            />
                            <ConfirmDialog
                              trigger={
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              }
                              title={t("budget.confirmDeleteExpense")}
                              description={`"${exp.title}"`}
                              onConfirm={
                                onDeleteExpense
                                  ? () => onDeleteExpense(exp.id)
                                  : async () => {
                                      await deleteExpenseAction(weddingId, exp.id);
                                    }
                              }
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
  );
}
