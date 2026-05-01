"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend,
} from "recharts";
import { formatCurrency } from "@/lib/utils/format";
import { toRgba } from "@/lib/utils/budget-colors";
import type { BudgetCategory } from "@/lib/types/database";

interface BudgetChartProps {
  /** Pre-sorted categories — order determines the bar order in the chart. */
  categories: BudgetCategory[];
  currency?: string;
  /** Stable color map: category id → [r, g, b]. Built by BudgetSortableSection. */
  colorMap?: Map<string, [number, number, number]>;
}

const FALLBACK_RGB: [number, number, number] = [140, 140, 140];

export function BudgetChart({ categories, currency = "USD", colorMap }: BudgetChartProps) {
  const data = categories.map((c) => ({
    id: c.id,
    name: c.name.length > 12 ? c.name.slice(0, 12) + "…" : c.name,
    Planned: c.planned_amount,
    Actual: c.actual_amount,
    overBudget: c.actual_amount > c.planned_amount,
  }));

  return (
    <div className="space-y-3">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 28 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11 }}
            angle={-30}
            textAnchor="end"
            interval={0}
          />
          <YAxis
            tickFormatter={(v) => formatCurrency(v, currency)}
            tick={{ fontSize: 11 }}
            width={72}
          />
          <Tooltip
            formatter={(value: number, name: string) => [formatCurrency(value, currency), name]}
            contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid hsl(var(--border))" }}
          />
          {/* Planned bars — faded category color */}
          <Bar dataKey="Planned" radius={[3, 3, 0, 0]}>
            {data.map((entry, i) => {
              const rgb = colorMap?.get(entry.id) ?? FALLBACK_RGB;
              return <Cell key={i} fill={toRgba(rgb, 0.38)} />;
            })}
          </Bar>
          {/* Actual bars — full category color, red if over budget */}
          <Bar dataKey="Actual" radius={[3, 3, 0, 0]}>
            {data.map((entry, i) => {
              const rgb = colorMap?.get(entry.id) ?? FALLBACK_RGB;
              const fill = entry.overBudget
                ? "hsl(var(--destructive))"
                : toRgba(rgb, 1);
              return <Cell key={i} fill={fill} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Custom legend: explains opacity convention + shows category swatches */}
      <ChartLegend categories={categories} colorMap={colorMap} />
    </div>
  );
}

function ChartLegend({
  categories,
  colorMap,
}: {
  categories: BudgetCategory[];
  colorMap?: Map<string, [number, number, number]>;
}) {
  return (
    <div className="space-y-2 px-1 text-xs text-muted-foreground">
      {/* Planned vs Actual key */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-1.5">
          <span
            className="inline-block h-3 w-5 rounded-sm border border-border"
            style={{ background: toRgba([140, 140, 140], 0.38) }}
          />
          Planned
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="inline-block h-3 w-5 rounded-sm"
            style={{ background: toRgba([140, 140, 140], 1) }}
          />
          Actual
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="inline-block h-3 w-5 rounded-sm"
            style={{ background: "hsl(var(--destructive))" }}
          />
          Over budget
        </div>
      </div>
      {/* Category swatches */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {categories.map((cat) => {
          const rgb = colorMap?.get(cat.id) ?? FALLBACK_RGB;
          return (
            <div key={cat.id} className="flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                style={{ background: toRgba(rgb, 1) }}
              />
              {cat.name}
            </div>
          );
        })}
      </div>
    </div>
  );
}
