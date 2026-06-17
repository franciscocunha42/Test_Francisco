"use client";

import { cn } from "@/lib/utils/cn";
import { formatCurrency } from "@/lib/utils/format";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useT } from "@/lib/i18n/provider";
import type { BudgetCategory } from "@/lib/types/database";

interface BudgetSummaryProps {
  totalBudget: number;
  categories: BudgetCategory[];
  currency?: string;
}

export function BudgetSummary({ totalBudget, categories, currency = "USD" }: BudgetSummaryProps) {
  const t = useT();
  const totalPlanned = categories.reduce((s, c) => s + c.planned_amount, 0);
  const totalActual = categories.reduce((s, c) => s + c.actual_amount, 0);
  const remaining = totalBudget - totalActual;
  const overUnder = totalActual - totalPlanned;
  const pct = totalBudget > 0 ? Math.min(100, Math.round((totalActual / totalBudget) * 100)) : 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[
        { label: t("budget.totalBudget"),   value: formatCurrency(totalBudget, currency),    muted: false },
        { label: t("budget.totalPlanned"),  value: formatCurrency(totalPlanned, currency),   muted: false },
        { label: t("budget.totalActual"),   value: formatCurrency(totalActual, currency),    muted: false },
        {
          label: t("budget.remaining"),
          value: formatCurrency(Math.abs(remaining), currency),
          muted: false,
          danger: remaining < 0,
          prefix: remaining < 0 ? "−" : "",
        },
      ].map((item) => (
        <Card key={item.label}>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{item.label}</p>
            <p className={cn("mt-1 text-2xl font-semibold", item.danger && "text-destructive")}>
              {item.prefix}{item.value}
            </p>
          </CardContent>
        </Card>
      ))}
      <Card className="sm:col-span-2 lg:col-span-4">
        <CardContent className="p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">{t("budget.budgetUsed")}</span>
            <span className={cn("font-medium", pct >= 100 && "text-destructive")}>{pct}%</span>
          </div>
          <Progress value={pct} className={cn(pct >= 100 && "[&>*]:bg-destructive")} />
          {overUnder > 0 && (
            <p className="text-xs text-destructive">
              {t("budget.overPlanned").replace("{amount}", formatCurrency(overUnder, currency))}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
