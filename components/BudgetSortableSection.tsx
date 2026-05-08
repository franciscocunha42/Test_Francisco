"use client";

import { useMemo, useState } from "react";
import { BudgetChart } from "@/components/BudgetChart";
import { BudgetCategoriesCard, type SortOrder } from "@/components/BudgetCategoriesCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildColorMap } from "@/lib/utils/budget-colors";
import type { BudgetCategory } from "@/lib/types/database";
import type { BudgetCategoryFormValues } from "@/lib/schemas/budget";

interface Props {
  categories: BudgetCategory[];
  currency: string;
  weddingId: string;
  onSubmitCategory?: (
    data: BudgetCategoryFormValues,
    existing?: BudgetCategory,
  ) => Promise<{ ok: boolean; error?: string }>;
  onDeleteCategory?: (id: string) => void;
  selectedCategoryId?: string | null;
  onCategoryToggle?: (id: string) => void;
}

export function BudgetSortableSection({
  categories,
  currency,
  weddingId,
  onSubmitCategory,
  onDeleteCategory,
  selectedCategoryId,
  onCategoryToggle,
}: Props) {
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Color map is stable: keyed off original category order, not affected by sort.
  const colorMap = useMemo(() => buildColorMap(categories), [categories]);

  const sorted = useMemo(
    () =>
      [...categories].sort((a, b) =>
        sortOrder === "desc"
          ? b.planned_amount - a.planned_amount
          : a.planned_amount - b.planned_amount,
      ),
    [categories, sortOrder],
  );

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Planned vs Actual</CardTitle>
        </CardHeader>
        <CardContent>
          <BudgetChart
            categories={sorted}
            currency={currency}
            colorMap={colorMap}
            selectedCategoryId={selectedCategoryId}
            onBarClick={onCategoryToggle}
          />
        </CardContent>
      </Card>
      <BudgetCategoriesCard
        categories={sorted}
        currency={currency}
        weddingId={weddingId}
        sortOrder={sortOrder}
        onSortToggle={() => setSortOrder((s) => (s === "desc" ? "asc" : "desc"))}
        colorMap={colorMap}
        onSubmitCategory={onSubmitCategory}
        onDeleteCategory={onDeleteCategory}
        selectedCategoryId={selectedCategoryId}
        onCategoryClick={onCategoryToggle}
      />
    </div>
  );
}
