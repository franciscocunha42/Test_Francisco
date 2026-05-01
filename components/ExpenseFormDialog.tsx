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
import type { Expense, BudgetCategory } from "@/lib/types/database";

const PAYMENT_STATUSES = [
  { value: "unpaid", label: "Unpaid" },
  { value: "deposit_paid", label: "Deposit Paid" },
  { value: "partially_paid", label: "Partially Paid" },
  { value: "paid", label: "Paid" },
];

interface ExpenseFormDialogProps {
  weddingId: string;
  expense?: Expense;
  categories: BudgetCategory[];
  vendors: { id: string; name: string }[];
  trigger: React.ReactNode;
  onSubmit?: (data: ExpenseFormValues, existing?: Expense) => Promise<{ ok: boolean; error?: string }>;
}

export function ExpenseFormDialog({ weddingId, expense, categories, vendors, trigger, onSubmit: onSubmitProp }: ExpenseFormDialogProps) {
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: expense ?? { payment_status: "unpaid", planned_amount: 0, actual_amount: 0 },
  });

  async function onSubmit(data: ExpenseFormValues) {
    const result = onSubmitProp
      ? await onSubmitProp(data, expense)
      : expense
        ? await updateExpense(weddingId, expense.id, data)
        : await createExpense(weddingId, data);
    if (result?.ok === false) { toast.error(result.error); return; }
    toast.success(expense ? "Expense updated" : "Expense added");
    setOpen(false);
    reset();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{expense ? "Edit Expense" : "Add Expense"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label>Title *</Label>
            <Input {...register("title")} placeholder="e.g. Venue deposit" />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Category</Label>
              <Select
                defaultValue={expense?.category_id ?? "none"}
                onValueChange={(v) => setValue("category_id", v === "none" ? null : v)}
              >
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Vendor</Label>
              <Select
                defaultValue={expense?.vendor_id ?? "none"}
                onValueChange={(v) => setValue("vendor_id", v === "none" ? null : v)}
              >
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {vendors.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Planned Amount</Label>
              <Input type="number" step="0.01" {...register("planned_amount")} />
            </div>
            <div className="space-y-1">
              <Label>Actual Amount</Label>
              <Input type="number" step="0.01" {...register("actual_amount")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Payment Status</Label>
              <Select
                defaultValue={expense?.payment_status ?? "unpaid"}
                onValueChange={(v) => setValue("payment_status", v as ExpenseFormValues["payment_status"])}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Due Date</Label>
              <Input type="date" {...register("due_date")} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Notes</Label>
            <Textarea {...register("notes")} rows={2} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
