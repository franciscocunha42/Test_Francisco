"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, ArrowDownUp } from "lucide-react";
import { CategoryFormDialog } from "@/components/CategoryFormDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils/cn";
import { formatCurrency } from "@/lib/utils/format";
import { deleteBudgetCategory } from "@/lib/actions/budget";
import type { BudgetCategory } from "@/lib/types/database";
import type { BudgetCategoryFormValues } from "@/lib/schemas/budget";

type SortOrder = "desc" | "asc";

interface Props {
  categories: BudgetCategory[];
  currency: string;
  weddingId: string;
  /** When provided (guest mode), called instead of the server action. */
  onSubmitCategory?: (
    data: BudgetCategoryFormValues,
    existing?: BudgetCategory,
  ) => Promise<{ ok: boolean; error?: string }>;
  onDeleteCategory?: (id: string) => void;
}

export function BudgetCategoriesCard({
  categories,
  currency,
  weddingId,
  onSubmitCategory,
  onDeleteCategory,
}: Props) {
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const sorted = [...categories].sort((a, b) =>
    sortOrder === "desc"
      ? b.planned_amount - a.planned_amount
      : a.planned_amount - b.planned_amount,
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Categories</CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSortOrder((s) => (s === "desc" ? "asc" : "desc"))}
              className="h-7 gap-1.5 px-2 text-xs text-muted-foreground"
              title={sortOrder === "desc" ? "Sorted: highest first" : "Sorted: lowest first"}
            >
              <ArrowDownUp className="h-3.5 w-3.5" />
              {sortOrder === "desc" ? "High → Low" : "Low → High"}
            </Button>
            <CategoryFormDialog
              weddingId={weddingId}
              onSubmit={onSubmitCategory}
              trigger={
                <Button variant="ghost" size="sm">
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              }
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {sorted.map((cat) => {
          const pct =
            cat.planned_amount > 0
              ? Math.min(100, Math.round((cat.actual_amount / cat.planned_amount) * 100))
              : 0;
          const over = cat.actual_amount > cat.planned_amount;
          return (
            <div key={cat.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{cat.name}</span>
                <div className="flex items-center gap-2">
                  <span className={cn("text-xs", over && "text-destructive")}>
                    {formatCurrency(cat.actual_amount, currency)} /{" "}
                    {formatCurrency(cat.planned_amount, currency)}
                  </span>
                  <CategoryFormDialog
                    weddingId={weddingId}
                    category={cat}
                    onSubmit={onSubmitCategory}
                    trigger={
                      <button className="text-muted-foreground hover:text-foreground">
                        <Pencil className="h-3 w-3" />
                      </button>
                    }
                  />
                  <ConfirmDialog
                    trigger={
                      <button className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    }
                    title="Delete category"
                    description={`Delete "${cat.name}"?`}
                    onConfirm={
                      onDeleteCategory
                        ? () => onDeleteCategory(cat.id)
                        : async () => {
                            await deleteBudgetCategory(weddingId, cat.id);
                          }
                    }
                  />
                </div>
              </div>
              <Progress value={pct} className={cn(over && "[&>*]:bg-destructive")} />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
