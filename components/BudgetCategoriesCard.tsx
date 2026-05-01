"use client";

import { Plus, Pencil, Trash2, ArrowDownUp } from "lucide-react";
import { CategoryFormDialog } from "@/components/CategoryFormDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { toRgba } from "@/lib/utils/budget-colors";
import { getCategoryEmoji } from "@/lib/utils/category-emojis";
import { deleteBudgetCategory } from "@/lib/actions/budget";
import type { BudgetCategory } from "@/lib/types/database";
import type { BudgetCategoryFormValues } from "@/lib/schemas/budget";

function CategoryProgress({
  pct,
  over,
  rgb,
}: {
  pct: number;
  over: boolean;
  rgb?: [number, number, number];
}) {
  const fill = over
    ? "hsl(var(--destructive))"
    : rgb
      ? toRgba(rgb, 0.85)
      : "hsl(var(--primary))";
  return (
    <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${pct}%`, background: fill }}
      />
    </div>
  );
}

export type SortOrder = "desc" | "asc";

interface Props {
  /** Pre-sorted categories — order is controlled by the parent. */
  categories: BudgetCategory[];
  currency: string;
  weddingId: string;
  sortOrder: SortOrder;
  onSortToggle: () => void;
  /** Stable color map built from the original (unsorted) category list. */
  colorMap?: Map<string, [number, number, number]>;
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
  sortOrder,
  onSortToggle,
  colorMap,
  onSubmitCategory,
  onDeleteCategory,
}: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Categories</CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onSortToggle}
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
        {categories.map((cat) => {
          const pct =
            cat.planned_amount > 0
              ? Math.min(100, Math.round((cat.actual_amount / cat.planned_amount) * 100))
              : 0;
          const over = cat.actual_amount > cat.planned_amount;
          const rgb = colorMap?.get(cat.id);

          return (
            <div key={cat.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  {rgb && (
                    <span
                      className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: toRgba(rgb, 1) }}
                    />
                  )}
                  <span className="shrink-0">{getCategoryEmoji(cat.name)}</span>
                  <span className="font-medium truncate">{cat.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
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
              <CategoryProgress pct={pct} over={over} rgb={rgb} />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
