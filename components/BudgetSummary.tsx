import { cn } from "@/lib/utils/cn";
import { formatCurrency } from "@/lib/utils/format";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { BudgetCategory } from "@/lib/types/database";

interface BudgetSummaryProps {
  totalBudget: number;
  categories: BudgetCategory[];
  currency?: string;
}

export function BudgetSummary({ totalBudget, categories, currency = "USD" }: BudgetSummaryProps) {
  const totalPlanned = categories.reduce((s, c) => s + c.planned_amount, 0);
  const totalActual = categories.reduce((s, c) => s + c.actual_amount, 0);
  const remaining = totalBudget - totalActual;
  const overUnder = totalActual - totalPlanned;
  const pct = totalBudget > 0 ? Math.min(100, Math.round((totalActual / totalBudget) * 100)) : 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[
        { label: "Total Budget",   value: formatCurrency(totalBudget, currency),    muted: false },
        { label: "Total Planned",  value: formatCurrency(totalPlanned, currency),   muted: false },
        { label: "Total Actual",   value: formatCurrency(totalActual, currency),    muted: false },
        {
          label: "Remaining",
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
            <span className="font-medium">Budget used</span>
            <span className={cn("font-medium", pct >= 100 && "text-destructive")}>{pct}%</span>
          </div>
          <Progress value={pct} className={cn(pct >= 100 && "[&>*]:bg-destructive")} />
          {overUnder > 0 && (
            <p className="text-xs text-destructive">
              {formatCurrency(overUnder, currency)} over planned budget
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
