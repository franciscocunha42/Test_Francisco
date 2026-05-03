import { formatCurrency } from "@/lib/utils/format";

interface DashboardStatTilesProps {
  totalBudget: number;
  spentSoFar: number;
  guestsAttending: number;
  guestsTotal: number;
  currency: string;
}

export function DashboardStatTiles({
  totalBudget,
  spentSoFar,
  guestsAttending,
  guestsTotal,
  currency,
}: DashboardStatTilesProps) {
  const remaining = totalBudget - spentSoFar;
  const overBudget = remaining < 0;
  const pctSpent = totalBudget > 0 ? Math.round((spentSoFar / totalBudget) * 100) : 0;
  const pctConfirmed = guestsTotal > 0 ? Math.round((guestsAttending / guestsTotal) * 100) : 0;

  const tiles = [
    {
      label: "Total Budget",
      value: formatCurrency(totalBudget, currency),
      sub: "across all categories",
      bg: "bg-rose-200/70",
      border: "border-rose-300",
    },
    {
      label: "Spent So Far",
      value: formatCurrency(spentSoFar, currency),
      sub: `${pctSpent}% of budget used`,
      bg: "bg-sky-200/70",
      border: "border-sky-300",
    },
    {
      label: overBudget ? "Over Budget" : "Remaining",
      value: formatCurrency(Math.abs(remaining), currency),
      sub: overBudget ? "Exceeded plan" : "Available to spend",
      bg: overBudget ? "bg-red-200/70" : "bg-emerald-200/70",
      border: overBudget ? "border-red-300" : "border-emerald-300",
    },
    {
      label: "Guests Booked",
      value: `${guestsAttending} / ${guestsTotal}`,
      sub: `${pctConfirmed}% confirmed`,
      bg: "bg-amber-200/70",
      border: "border-amber-300",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {tiles.map((t) => (
        <div
          key={t.label}
          className={`rounded-xl border ${t.border} ${t.bg} p-4 shadow-sm`}
        >
          <p className="text-xs font-medium text-foreground/70">{t.label}</p>
          <p className="mt-1 font-serif text-2xl font-bold tabular-nums text-foreground">
            {t.value}
          </p>
          <p className="mt-1 text-[11px] text-foreground/60">{t.sub}</p>
        </div>
      ))}
    </div>
  );
}
