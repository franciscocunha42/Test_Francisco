import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/format";
import {
  getVendorFinance,
  paymentStatusLabel,
  paymentStatusVariant,
} from "@/lib/utils/vendor-finance";
import type { Vendor, Expense } from "@/lib/types/database";

interface SuppliersOverviewCardProps {
  vendors: Vendor[];
  expenses: Pick<Expense, "vendor_id" | "planned_amount" | "actual_amount" | "payment_status">[];
  currency: string;
  href: string;
  /** Max number of suppliers to show. Default 4. */
  limit?: number;
}

export function SuppliersOverviewCard({
  vendors,
  expenses,
  currency,
  href,
  limit = 4,
}: SuppliersOverviewCardProps) {
  // Show booked first, then shortlisted/contacted; cap at `limit`
  const ranked = [...vendors].sort((a, b) => {
    const order = { booked: 0, shortlisted: 1, contacted: 2, researching: 3, rejected: 4 };
    return (order[a.status] ?? 5) - (order[b.status] ?? 5);
  });
  const top = ranked.slice(0, limit);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Suppliers</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href={href}>View all</Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {top.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No suppliers yet</p>
        ) : (
          top.map((v) => {
            const f = getVendorFinance(v, expenses);
            return (
              <div key={v.id} className="rounded-md border px-3 py-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="truncate text-sm font-medium">{v.name}</span>
                  <Badge variant={paymentStatusVariant[f.status]} className="shrink-0 text-xs">
                    {paymentStatusLabel[f.status]}
                  </Badge>
                </div>
                {(f.planned != null || f.actual != null) && (
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    {f.planned != null && (
                      <span>Planned: <span className="text-foreground font-medium">{formatCurrency(f.planned, currency)}</span></span>
                    )}
                    {f.actual != null && (
                      <span>Actual: <span className="text-foreground font-medium">{formatCurrency(f.actual, currency)}</span></span>
                    )}
                    {f.paidPartial > 0 && (
                      <span>Paid: <span className="text-emerald-600 font-medium">{formatCurrency(f.paidPartial, currency)}</span></span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
