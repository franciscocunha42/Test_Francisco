"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { expenseSchema, type ExpenseFormValues } from "@/lib/schemas/budget";
import { createExpense, updateExpense } from "@/lib/actions/budget";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useT } from "@/lib/i18n/provider";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import type { Expense, BudgetCategory } from "@/lib/types/database";

const PAYMENT_STATUSES: Array<{ value: "unpaid" | "deposit_paid" | "partially_paid" | "paid"; labelKey: TranslationKey }> = [
  { value: "unpaid",         labelKey: "suppliers.paymentUnpaid" },
  { value: "deposit_paid",   labelKey: "suppliers.paymentDepositPaid" },
  { value: "partially_paid", labelKey: "suppliers.paymentPartiallyPaid" },
  { value: "paid",           labelKey: "suppliers.paymentPaid" },
];

interface ExpenseFormDialogProps {
  weddingId: string;
  expense?: Expense;
  /** Pre-fill fields when creating a new expense (e.g. vendor_id from a VendorCard). */
  prefill?: { vendor_id?: string; category_id?: string; title?: string };
  categories: BudgetCategory[];
  vendors: { id: string; name: string }[];
  trigger: React.ReactNode;
  onSubmit?: (data: ExpenseFormValues, existing?: Expense) => Promise<{ ok: boolean; error?: string }>;
}

export function ExpenseFormDialog({ weddingId, expense, prefill, categories, vendors, trigger, onSubmit: onSubmitProp }: ExpenseFormDialogProps) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const defaults = expense ?? {
    payment_status: "unpaid" as const,
    planned_amount: 0,
    actual_amount: 0,
    vendor_id: prefill?.vendor_id ?? null,
    category_id: prefill?.category_id ?? null,
    title: prefill?.title ?? "",
  };
  const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: defaults,
  });

  async function onSubmit(data: ExpenseFormValues) {
    const result = onSubmitProp
      ? await onSubmitProp(data, expense)
      : expense
        ? await updateExpense(weddingId, expense.id, data)
        : await createExpense(weddingId, data);
    if (result?.ok === false) { toast.error(result.error); return; }
    toast.success(expense ? t("budget.expenseUpdated") : t("budget.expenseCreated"));
    setOpen(false);
    reset();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{expense ? t("budget.editExpense") : t("budget.newExpense")}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label>{t("common.title")} *</Label>
            <Input {...register("title")} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>{t("budget.expenseCategory")}</Label>
              <Select
                defaultValue={expense?.category_id ?? prefill?.category_id ?? "none"}
                onValueChange={(v) => setValue("category_id", v === "none" ? null : v)}
              >
                <SelectTrigger><SelectValue placeholder={t("common.none")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("common.none")}</SelectItem>
                  {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>{t("budget.vendor")}</Label>
              <Select
                defaultValue={expense?.vendor_id ?? prefill?.vendor_id ?? "none"}
                onValueChange={(v) => setValue("vendor_id", v === "none" ? null : v)}
              >
                <SelectTrigger><SelectValue placeholder={t("common.none")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("common.none")}</SelectItem>
                  {vendors.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>{t("budget.plannedAmount")}</Label>
              <Input type="number" step="0.01" {...register("planned_amount")} />
            </div>
            <div className="space-y-1">
              <Label>{t("budget.actual")}</Label>
              <Input type="number" step="0.01" {...register("actual_amount")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>{t("budget.paymentStatus")}</Label>
              <Select
                defaultValue={expense?.payment_status ?? "unpaid"}
                onValueChange={(v) => setValue("payment_status", v as ExpenseFormValues["payment_status"])}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{t(s.labelKey)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>{t("timeline.dueDate")}</Label>
              <Input type="date" {...register("due_date")} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>{t("common.notes")}</Label>
            <Textarea {...register("notes")} rows={2} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? t("common.saving") : t("common.save")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
