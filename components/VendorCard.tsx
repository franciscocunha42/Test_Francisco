"use client";

import { useState } from "react";
import { Pencil, Trash2, Globe, Phone, Mail, Receipt, Plus, ChevronDown, Star, Users } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import { formatCurrency } from "@/lib/utils/format";
import { capitalize } from "@/lib/utils/format";
import { deleteVendor } from "@/lib/actions/vendor";
import { deleteExpense, patchExpenseStatus } from "@/lib/actions/budget";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VendorFormDialog } from "@/components/VendorFormDialog";
import { ExpenseFormDialog } from "@/components/ExpenseFormDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  getVendorFinance,
  paymentStatusLabel,
  paymentStatusVariant,
} from "@/lib/utils/vendor-finance";
import type { Vendor, Expense, BudgetCategory, PaymentStatus } from "@/lib/types/database";
import type { VendorFormValues } from "@/lib/schemas/vendor";
import type { ExpenseFormValues } from "@/lib/schemas/budget";

const statusColors: Record<string, "default" | "secondary" | "warning" | "info" | "success" | "destructive"> = {
  researching: "secondary",
  contacted: "info",
  shortlisted: "warning",
  booked: "success",
  rejected: "destructive",
};

const PAYMENT_STATUSES: { value: PaymentStatus; label: string }[] = [
  { value: "unpaid", label: "Unpaid" },
  { value: "deposit_paid", label: "Deposit Paid" },
  { value: "partially_paid", label: "Partially Paid" },
  { value: "paid", label: "Paid" },
];

interface VendorCardProps {
  vendor: Vendor;
  weddingId: string;
  currency?: string;
  /** Full expense objects for this wedding. Linked expenses filtered client-side. */
  expenses?: Expense[];
  /** Budget categories — required for the add/edit expense form. */
  categories?: BudgetCategory[];
  /** Guest-mode override for vendor edit. */
  onEditSubmit?: (data: VendorFormValues, existing?: Vendor) => Promise<{ ok: boolean; error?: string }>;
  /** Guest-mode override for vendor delete. */
  onDelete?: (vendorId: string) => Promise<{ ok: boolean; error?: string }>;
  /** Guest-mode override for expense creation. */
  onAddExpense?: (data: ExpenseFormValues) => Promise<{ ok: boolean; error?: string }>;
  /** Guest-mode override for expense update. */
  onUpdateExpense?: (expenseId: string, data: ExpenseFormValues) => Promise<{ ok: boolean; error?: string }>;
  /** Guest-mode override for expense deletion. */
  onDeleteExpense?: (expenseId: string) => Promise<{ ok: boolean; error?: string }>;
  /** Guest-mode override for payment status quick-change. */
  onUpdateExpenseStatus?: (expenseId: string, status: PaymentStatus) => Promise<{ ok: boolean; error?: string }>;
}

export function VendorCard({
  vendor,
  weddingId,
  currency = "USD",
  expenses = [],
  categories,
  onEditSubmit,
  onDelete,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
  onUpdateExpenseStatus,
}: VendorCardProps) {
  const [showExpenses, setShowExpenses] = useState(false);

  const linkedExpenses = expenses.filter((e) => e.vendor_id === vendor.id);
  const finance = getVendorFinance(vendor, expenses);

  async function handleVendorDelete() {
    const result = onDelete
      ? await onDelete(vendor.id)
      : await deleteVendor(weddingId, vendor.id);
    if (result?.ok === false) toast.error(result.error);
    else toast.success("Vendor removed");
  }

  async function handleExpenseDelete(expenseId: string) {
    const result = onDeleteExpense
      ? await onDeleteExpense(expenseId)
      : await deleteExpense(weddingId, expenseId);
    if (result?.ok === false) toast.error(result.error ?? "Failed to delete expense");
    else toast.success("Expense removed");
  }

  async function handleStatusChange(expenseId: string, status: PaymentStatus) {
    const result = onUpdateExpenseStatus
      ? await onUpdateExpenseStatus(expenseId, status)
      : await patchExpenseStatus(weddingId, expenseId, status);
    if (result?.ok === false) toast.error(result.error ?? "Failed to update status");
  }

  // Single handler for ExpenseFormDialog — covers both create and edit
  function makeExpenseSubmitHandler(existing?: Expense) {
    return async (data: ExpenseFormValues) => {
      if (existing) {
        return onUpdateExpense
          ? await onUpdateExpense(existing.id, data)
          : await import("@/lib/actions/budget").then((m) =>
              m.updateExpense(weddingId, existing.id, data),
            );
      }
      return onAddExpense
        ? await onAddExpense(data)
        : await import("@/lib/actions/budget").then((m) =>
            m.createExpense(weddingId, data),
          );
    };
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold truncate">{vendor.name}</p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <Badge variant={statusColors[vendor.status]} className="text-xs">{capitalize(vendor.status)}</Badge>
              <Badge variant={paymentStatusVariant[finance.status]} className="text-xs">
                {paymentStatusLabel[finance.status]}
              </Badge>
            </div>
          </div>
          <div className="flex gap-1 shrink-0">
            <VendorFormDialog
              weddingId={weddingId}
              vendor={vendor}
              onSubmit={onEditSubmit}
              trigger={<Button variant="ghost" size="icon" className="h-7 w-7"><Pencil className="h-3.5 w-3.5" /></Button>}
            />
            <ConfirmDialog
              trigger={<Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>}
              title="Remove vendor"
              description={`Remove "${vendor.name}"?`}
              onConfirm={handleVendorDelete}
            />
          </div>
        </div>

        {vendor.contact_name && <p className="text-sm text-muted-foreground">{vendor.contact_name}</p>}

        {/* Venue-specific metadata */}
        {vendor.category === "venue" && (vendor.rating != null || vendor.max_capacity != null || vendor.price_per_person != null) && (
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            {vendor.rating != null && (
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {vendor.rating.toFixed(1)}
              </span>
            )}
            {(vendor.min_capacity != null || vendor.max_capacity != null) && (
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {vendor.min_capacity != null && vendor.max_capacity != null
                  ? `${vendor.min_capacity}–${vendor.max_capacity} guests`
                  : vendor.max_capacity != null
                    ? `Up to ${vendor.max_capacity} guests`
                    : `From ${vendor.min_capacity} guests`}
              </span>
            )}
            {vendor.price_per_person != null && (
              <span className="flex items-center gap-1">
                From {formatCurrency(vendor.price_per_person, currency)}/person
              </span>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {vendor.email && (
            <a href={`mailto:${vendor.email}`} className="flex items-center gap-1 hover:text-foreground">
              <Mail className="h-3 w-3" />{vendor.email}
            </a>
          )}
          {vendor.phone && (
            <a href={`tel:${vendor.phone}`} className="flex items-center gap-1 hover:text-foreground">
              <Phone className="h-3 w-3" />{vendor.phone}
            </a>
          )}
          {vendor.website && (
            <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-foreground">
              <Globe className="h-3 w-3" />Website
            </a>
          )}
        </div>

        {/* Finance summary grid */}
        <div className="grid grid-cols-2 gap-2 rounded-md bg-muted/50 p-2 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Planned</p>
            <p className="font-medium">{finance.planned != null ? formatCurrency(finance.planned, currency) : "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Actual</p>
            <p className={cn(
              "font-medium",
              finance.actual != null && finance.planned != null && finance.actual > finance.planned && "text-destructive",
            )}>
              {finance.actual != null ? formatCurrency(finance.actual, currency) : "—"}
            </p>
          </div>
        </div>

        {/* Expenses section */}
        <div className="border-t pt-2 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowExpenses((p) => !p)}
            >
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showExpenses && "rotate-180")} />
              <Receipt className="h-3 w-3" />
              {linkedExpenses.length === 0
                ? "No linked expenses"
                : `${linkedExpenses.length} expense${linkedExpenses.length !== 1 ? "s" : ""} · ${formatCurrency(finance.paidPartial, currency)} paid`}
            </button>

            {categories && (
              <ExpenseFormDialog
                weddingId={weddingId}
                categories={categories}
                vendors={[{ id: vendor.id, name: vendor.name }]}
                prefill={{ vendor_id: vendor.id }}
                onSubmit={makeExpenseSubmitHandler()}
                trigger={
                  <Button variant="ghost" size="sm" className="h-6 gap-1 px-1.5 text-xs">
                    <Plus className="h-3 w-3" />Add
                  </Button>
                }
              />
            )}
          </div>

          {showExpenses && linkedExpenses.length > 0 && (
            <div className="space-y-1">
              {linkedExpenses.map((exp) => (
                <div
                  key={exp.id}
                  className="flex items-center gap-1.5 rounded border bg-muted/20 px-2 py-1.5 text-xs"
                >
                  <span className="min-w-0 flex-1 truncate font-medium">{exp.title}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {formatCurrency(exp.actual_amount, currency)}
                  </span>
                  <Select
                    value={exp.payment_status}
                    onValueChange={(v) => handleStatusChange(exp.id, v as PaymentStatus)}
                  >
                    <SelectTrigger className="h-5 w-[100px] shrink-0 px-1.5 text-[11px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value} className="text-xs">
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {categories && (
                    <ExpenseFormDialog
                      weddingId={weddingId}
                      expense={exp}
                      categories={categories}
                      vendors={[{ id: vendor.id, name: vendor.name }]}
                      onSubmit={makeExpenseSubmitHandler(exp)}
                      trigger={
                        <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0">
                          <Pencil className="h-3 w-3" />
                        </Button>
                      }
                    />
                  )}
                  <ConfirmDialog
                    trigger={
                      <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0 text-destructive hover:text-destructive">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    }
                    title="Delete expense"
                    description={`Delete "${exp.title}"?`}
                    onConfirm={() => handleExpenseDelete(exp.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {vendor.notes && <p className="text-xs text-muted-foreground line-clamp-2 border-t pt-2">{vendor.notes}</p>}
      </CardContent>
    </Card>
  );
}
