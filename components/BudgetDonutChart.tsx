"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/utils/format";
import { buildColorMap, toRgba } from "@/lib/utils/budget-colors";
import { getCategoryEmoji } from "@/lib/utils/category-emojis";
import type { BudgetCategory } from "@/lib/types/database";

interface BudgetDonutChartProps {
  categories: BudgetCategory[];
  currency: string;
  /** When true, slices = planned; otherwise slices = actual spend. */
  usePlanned?: boolean;
}

export function BudgetDonutChart({
  categories,
  currency,
  usePlanned = false,
}: BudgetDonutChartProps) {
  const colorMap = buildColorMap(categories);
  const data = categories
    .map((c) => ({
      id: c.id,
      name: c.name,
      value: usePlanned ? c.planned_amount ?? 0 : c.actual_amount ?? 0,
    }))
    .filter((d) => d.value > 0);

  const total = data.reduce((s, d) => s + d.value, 0);

  if (data.length === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
        No {usePlanned ? "budget" : "expenses"} yet
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              stroke="white"
              strokeWidth={2}
            >
              {data.map((entry) => {
                const rgb = colorMap.get(entry.id) ?? [140, 140, 140];
                return <Cell key={entry.id} fill={toRgba(rgb, 0.85)} />;
              })}
            </Pie>
            <Tooltip
              formatter={(v: number, _name, item) => [
                formatCurrency(v, currency),
                item?.payload?.name,
              ]}
              contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid hsl(var(--border))" }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {usePlanned ? "Planned" : "Spent"}
          </p>
          <p className="font-serif text-lg font-semibold tabular-nums">
            {formatCurrency(total, currency)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {data.map((entry) => {
          const rgb = colorMap.get(entry.id) ?? [140, 140, 140];
          return (
            <div key={entry.id} className="flex items-center gap-1.5 truncate">
              <span
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: toRgba(rgb, 1) }}
              />
              <span className="truncate">
                {getCategoryEmoji(entry.name)} {entry.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
