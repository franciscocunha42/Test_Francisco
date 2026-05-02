"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { seatingTableSchema, type SeatingTableFormValues } from "@/lib/schemas/seating";
import { createSeatingTable, updateSeatingTable } from "@/lib/actions/seating";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { SeatingTable } from "@/lib/types/database";

interface SeatingTableFormDialogProps {
  weddingId: string;
  table?: SeatingTable;
  trigger: React.ReactNode;
  onSubmit?: (data: SeatingTableFormValues, existing?: SeatingTable) => Promise<{ ok: boolean; error?: string }>;
}

export function SeatingTableFormDialog({ weddingId, table, trigger, onSubmit: onSubmitProp }: SeatingTableFormDialogProps) {
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<SeatingTableFormValues>({
    resolver: zodResolver(seatingTableSchema),
    defaultValues: table ?? { name: "", capacity: 8, notes: "" },
  });

  async function onSubmit(data: SeatingTableFormValues) {
    const result = onSubmitProp
      ? await onSubmitProp(data, table)
      : table
        ? await updateSeatingTable(weddingId, table.id, data)
        : await createSeatingTable(weddingId, data);
    if (result?.ok === false) { toast.error(result.error); return; }
    toast.success(table ? "Table updated" : "Table added");
    setOpen(false);
    reset();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{table ? "Edit Table" : "Add Table"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label>Table Name *</Label>
            <Input {...register("name")} placeholder="e.g. Table 1, Family, Round 12" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1">
            <Label>Capacity *</Label>
            <Input type="number" min={1} max={50} {...register("capacity")} />
            {errors.capacity && <p className="text-xs text-destructive">{errors.capacity.message}</p>}
          </div>
          <div className="space-y-1">
            <Label>Notes</Label>
            <Textarea rows={2} {...register("notes")} placeholder="Optional venue notes" />
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
