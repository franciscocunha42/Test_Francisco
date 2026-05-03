import type { Vendor, Expense, PaymentStatus } from "@/lib/types/database";

export type VendorPaymentStatus = "paid" | "partial" | "unpaid" | "no_expenses";

export interface VendorFinance {
  /** Planned cost — sum of linked expense.planned_amount; falls back to vendor.quoted_price. */
  planned: number | null;
  /** Actual cost — sum of linked expense.actual_amount; falls back to vendor.actual_cost. */
  actual: number | null;
  /** Sum of linked expense.actual_amount with payment_status === "paid". */
  paid: number;
  /** Sum of linked expense.actual_amount where the expense is settled (deposit_paid + partially_paid + paid). */
  paidPartial: number;
  /** Aggregated payment status across linked expenses. */
  status: VendorPaymentStatus;
  /** Number of expenses linked to this vendor. */
  expenseCount: number;
  /** Whether the planned/actual values came from linked expenses (vs vendor fields). */
  fromExpenses: boolean;
}

type VendorFinanceVendor = Pick<Vendor, "id" | "quoted_price" | "actual_cost">;
type VendorFinanceExpense = Pick<Expense, "vendor_id" | "planned_amount" | "actual_amount" | "payment_status">;

export function getVendorFinance(
  vendor: VendorFinanceVendor,
  expenses: VendorFinanceExpense[],
): VendorFinance {
  const linked = expenses.filter((e) => e.vendor_id === vendor.id);

  if (linked.length === 0) {
    return {
      planned: vendor.quoted_price,
      actual: vendor.actual_cost,
      paid: 0,
      paidPartial: 0,
      status: "no_expenses",
      expenseCount: 0,
      fromExpenses: false,
    };
  }

  let planned = 0;
  let actual = 0;
  let paid = 0;
  let paidPartial = 0;
  const statuses = new Set<PaymentStatus>();

  for (const e of linked) {
    planned += e.planned_amount ?? 0;
    actual += e.actual_amount ?? 0;
    statuses.add(e.payment_status);
    if (e.payment_status === "paid") {
      paid += e.actual_amount ?? 0;
      paidPartial += e.actual_amount ?? 0;
    } else if (e.payment_status === "deposit_paid" || e.payment_status === "partially_paid") {
      paidPartial += e.actual_amount ?? 0;
    }
  }

  let status: VendorPaymentStatus;
  if (statuses.size === 1 && statuses.has("paid")) status = "paid";
  else if (statuses.size === 1 && statuses.has("unpaid")) status = "unpaid";
  else status = "partial";

  return {
    planned,
    actual,
    paid,
    paidPartial,
    status,
    expenseCount: linked.length,
    fromExpenses: true,
  };
}

export const paymentStatusLabel: Record<VendorPaymentStatus, string> = {
  paid: "Paid",
  partial: "Partial",
  unpaid: "Unpaid",
  no_expenses: "Not invoiced",
};

export const paymentStatusVariant: Record<VendorPaymentStatus, "success" | "warning" | "secondary" | "outline"> = {
  paid: "success",
  partial: "warning",
  unpaid: "secondary",
  no_expenses: "outline",
};

/** Sum totals across many vendors (for the suppliers page header). */
export function summariseVendorFinances(
  vendors: VendorFinanceVendor[],
  expenses: VendorFinanceExpense[],
): { planned: number; actual: number; paid: number } {
  let planned = 0;
  let actual = 0;
  let paid = 0;
  for (const v of vendors) {
    const f = getVendorFinance(v, expenses);
    planned += f.planned ?? 0;
    actual += f.actual ?? 0;
    paid += f.paid;
  }
  return { planned, actual, paid };
}
