"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Cell,
} from "recharts";
import { formatCurrency } from "@/lib/utils/format";
import type { BudgetCategory } from "@/lib/types/database";

interface BudgetChartProps {
  categories: BudgetCategory[];
  currency?: string;
}

export function BudgetChart({ categories, currency = "USD" }: BudgetChartProps) {
  const data = categories.map((c) => ({
    name: c.name.length > 12 ? c.name.slice(0, 12) + "…" : c.name,
    Planned: c.planned_amount,
    Actual: c.actual_amount,
    overBudget: c.actual_amount > c.planned_amount,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 24 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" interval={0} />
        <YAxis tickFormatter={(v) => formatCurrency(v, currency)} tick={{ fontSize: 11 }} width={72} />
        <Tooltip
          formatter={(value: number) => formatCurrency(value, currency)}
          contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid hsl(var(--border))" }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="Planned" fill="hsl(var(--primary))" fillOpacity={0.5} radius={[3, 3, 0, 0]} />
        <Bar dataKey="Actual" radius={[3, 3, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.overBudget ? "hsl(var(--destructive))" : "hsl(var(--primary))"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
