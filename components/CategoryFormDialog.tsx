"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { budgetCategorySchema, type BudgetCategoryFormValues } from "@/lib/schemas/budget";
import { createBudgetCategory, updateBudgetCategory } from "@/lib/actions/budget";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BudgetCategory } from "@/lib/types/database";

interface CategoryFormDialogProps {
  weddingId: string;
  category?: BudgetCategory;
  trigger: React.ReactNode;
}

export function CategoryFormDialog({ weddingId, category, trigger }: CategoryFormDialogProps) {
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<BudgetCategoryFormValues>({
    resolver: zodResolver(budgetCategorySchema),
    defaultValues: category ?? { planned_amount: 0 },
  });

  async function onSubmit(data: BudgetCategoryFormValues) {
    const result = category
      ? await updateBudgetCategory(weddingId, category.id, data)
      : await createBudgetCategory(weddingId, data);
    if (result?.ok === false) { toast.error(result.error); return; }
    toast.success(category ? "Category updated" : "Category created");
    setOpen(false);
    reset();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{category ? "Edit Category" : "New Budget Category"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label>Name *</Label>
            <Input {...register("name")} placeholder="e.g. Photography" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1">
            <Label>Planned Amount</Label>
            <Input type="number" step="0.01" {...register("planned_amount")} />
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
