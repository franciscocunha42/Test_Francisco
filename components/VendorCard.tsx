"use client";

import { useState } from "react";
import {
  Pencil, Trash2, Globe, Phone, Mail, Receipt, Plus, ChevronDown, Star, Users,
  Camera, Music, Building2, TreeDeciduous, Utensils, Sparkles, Car,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import { formatCurrency } from "@/lib/utils/format";
import { capitalize } from "@/lib/utils/format";
import { deleteVendor } from "@/lib/actions/vendor";
import { deleteExpense, patchExpenseStatus } from "@/lib/actions/budget";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

const CATEGORY_CONFIG: Record<string, { label: string; gradient: string; Icon: React.ElementType }> = {
  venue:       { label: "Venue",       gradient: "from-emerald-500 to-green-700",  Icon: TreeDeciduous },
  catering:    { label: "Catering",    gradient: "from-orange-400 to-amber-600",   Icon: Utensils },
  dj:          { label: "DJ",          gradient: "from-purple-500 to-violet-700",  Icon: Music },
  music:       { label: "Music",       gradient: "from-indigo-500 to-blue-700",    Icon: Music },
  photography: { label: "Photography", gradient: "from-pink-400 to-rose-600",      Icon: Camera },
  videography: { label: "Videography", gradient: "from-red-400 to-rose-700",       Icon: Camera },
  flowers:     { label: "Flowers",     gradient: "from-pink-300 to-fuchsia-500",   Icon: Sparkles },
  cake:        { label: "Cake",        gradient: "from-yellow-400 to-amber-500",   Icon: Sparkles },
  transport:   { label: "Transport",   gradient: "from-cyan-400 to-sky-600",       Icon: Car },
  makeup:      { label: "Makeup",      gradient: "from-fuchsia-400 to-purple-600", Icon: Sparkles },
  dress:       { label: "Dress",       gradient: "from-violet-400 to-purple-600",  Icon: Sparkles },
  suit:        { label: "Suit",        gradient: "from-slate-500 to-gray-700",     Icon: Building2 },
  stationery:  { label: "Stationery",  gradient: "from-amber-400 to-yellow-600",   Icon: Building2 },
  other:       { label: "Other",       gradient: "from-gray-400 to-gray-600",      Icon: Building2 },
};

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

  const cfg = CATEGORY_CONFIG[vendor.category ?? "other"] ?? CATEGORY_CONFIG.other;
  const { Icon } = cfg;
  const photos = vendor.photos ?? [];
  const heroPhoto = photos[0];

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
    <div className="flex rounded-xl border bg-card overflow-hidden transition-shadow hover:shadow-md">
      {/* Left: photo or gradient placeholder */}
      <div className="hidden sm:block relative w-44 shrink-0 overflow-hidden">
        {heroPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroPhoto}
            alt={vendor.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className={cn(
              "flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br",
              cfg.gradient,
            )}
          >
            <Icon className="h-10 w-10 text-white/70" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-white/80">
              {cfg.label}
            </span>
          </div>
        )}
        {photos.length > 1 && (
          <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white">
            <Camera className="h-3 w-3" />
            {photos.length}
          </span>
        )}
      </div>

      {/* Right: content */}
      <div className="flex flex-1 flex-col gap-2 p-4 min-w-0">
        {/* Name + actions */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {vendor.website ? (
              <a
                href={vendor.website}
                target="_blank"
                rel="noopener noreferrer"
                className="block font-semibold text-base leading-snug truncate hover:underline focus:underline focus:outline-none"
                title={vendor.website}
              >
                {vendor.name}
              </a>
            ) : (
              <p className="font-semibold text-base leading-snug truncate">{vendor.name}</p>
            )}
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
              <span>From {formatCurrency(vendor.price_per_person, currency)}/person</span>
            )}
          </div>
        )}

        {/* Contact links */}
        {(vendor.email || vendor.phone || vendor.website) && (
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
        )}

        {/* Finance summary */}
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
      </div>
    </div>
  );
}
