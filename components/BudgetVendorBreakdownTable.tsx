import { capitalize, formatCurrency } from "@/lib/utils/format";
import { getVendorFinance } from "@/lib/utils/vendor-finance";
import type { Vendor, Expense } from "@/lib/types/database";

interface BudgetVendorBreakdownTableProps {
  vendors: Vendor[];
  expenses: Pick<Expense, "vendor_id" | "planned_amount" | "actual_amount" | "payment_status">[];
  currency: string;
  /** Max rows to show. Default 8. */
  limit?: number;
}

export function BudgetVendorBreakdownTable({
  vendors,
  expenses,
  currency,
  limit = 8,
}: BudgetVendorBreakdownTableProps) {
  if (vendors.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Add suppliers to see your spending breakdown.
      </p>
    );
  }

  const rows = vendors
    .map((v) => {
      const f = getVendorFinance(v, expenses);
      const budget = f.planned ?? 0;
      const paid = f.paidPartial;
      const remaining = budget - paid;
      const progress = budget > 0 ? Math.min(100, Math.round((paid / budget) * 100)) : 0;
      return { vendor: v, budget, paid, remaining, progress };
    })
    .sort((a, b) => b.budget - a.budget)
    .slice(0, limit);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-[11px] uppercase tracking-wide text-muted-foreground">
            <th className="py-2 pr-2 font-medium">Vendor</th>
            <th className="py-2 px-2 font-medium">Category</th>
            <th className="py-2 px-2 text-right font-medium">Budget</th>
            <th className="py-2 px-2 text-right font-medium">Paid</th>
            <th className="py-2 px-2 text-right font-medium">Remaining</th>
            <th className="py-2 pl-2 font-medium" style={{ minWidth: 140 }}>Progress</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ vendor, budget, paid, remaining, progress }) => {
            const overBudget = remaining < 0;
            const fullyPaid = progress >= 100 && !overBudget;
            return (
              <tr key={vendor.id} className="border-b last:border-b-0">
                <td className="py-2.5 pr-2">
                  <p className="truncate font-medium text-foreground">{vendor.name}</p>
                </td>
                <td className="py-2.5 px-2 text-xs text-muted-foreground">
                  {capitalize(vendor.category)}
                </td>
                <td className="py-2.5 px-2 text-right tabular-nums">
                  {formatCurrency(budget, currency)}
                </td>
                <td className="py-2.5 px-2 text-right tabular-nums">
                  {formatCurrency(paid, currency)}
                </td>
                <td
                  className={`py-2.5 px-2 text-right tabular-nums ${
                    overBudget ? "font-medium text-destructive" : ""
                  }`}
                >
                  {formatCurrency(Math.abs(remaining), currency)}
                  {overBudget && <span className="ml-1 text-xs">over</span>}
                </td>
                <td className="py-2.5 pl-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full ${
                          overBudget
                            ? "bg-destructive"
                            : fullyPaid
                              ? "bg-emerald-500"
                              : "bg-primary"
                        }`}
                        style={{ width: `${overBudget ? 100 : progress}%` }}
                      />
                    </div>
                    <span className="w-9 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                      {progress}%
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
