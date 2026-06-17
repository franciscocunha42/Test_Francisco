"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { taskSchema, type TaskFormValues } from "@/lib/schemas/timeline";
import { createTask, updateTask } from "@/lib/actions/timeline";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DEFAULT_BUDGET_CATEGORY_NAMES } from "@/lib/utils/budget-categories";
import { useT } from "@/lib/i18n/provider";
import type { TimelineTask } from "@/lib/types/database";

interface TaskFormDialogProps {
  weddingId: string;
  task?: TimelineTask;
  trigger: React.ReactNode;
  /** Category names available in the dropdown. Defaults to the standard budget categories. */
  categories?: string[];
  onSubmit?: (data: TaskFormValues, existing?: TimelineTask) => Promise<{ ok: boolean; error?: string }>;
}

export function TaskFormDialog({ weddingId, task, trigger, categories, onSubmit: onSubmitProp }: TaskFormDialogProps) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: task ?? { status: "not_started", priority: "medium" },
  });

  const categoryValue = watch("category") ?? "";
  // Merge defaults + the wedding's actual budget categories + the task's own category if it falls outside.
  const categoryOptions = Array.from(
    new Set([
      ...DEFAULT_BUDGET_CATEGORY_NAMES,
      ...(categories ?? []),
      ...(task?.category ? [task.category] : []),
    ].filter(Boolean) as string[]),
  );

  async function onSubmit(data: TaskFormValues) {
    const result = onSubmitProp
      ? await onSubmitProp(data, task)
      : task
        ? await updateTask(weddingId, task.id, data)
        : await createTask(weddingId, data);
    if (result?.ok === false) { toast.error(result.error); return; }
    toast.success(task ? t("timeline.taskUpdated") : t("timeline.taskCreated"));
    setOpen(false);
    reset();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{task ? t("timeline.editTask") : t("timeline.newTask")}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label>{t("timeline.taskTitle")} *</Label>
            <Input {...register("title")} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-1">
            <Label>{t("timeline.description")}</Label>
            <Textarea {...register("description")} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>{t("timeline.category")}</Label>
              <Select
                value={categoryValue || "none"}
                onValueChange={(v) => setValue("category", v === "none" ? null : v, { shouldDirty: true })}
              >
                <SelectTrigger><SelectValue placeholder={t("timeline.category")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("common.none")}</SelectItem>
                  {categoryOptions.map((name) => (
                    <SelectItem key={name} value={name}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>{t("timeline.dueDate")}</Label>
              <Input type="date" {...register("due_date")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>{t("timeline.priority")}</Label>
              <Select defaultValue={task?.priority ?? "medium"} onValueChange={(v) => setValue("priority", v as TaskFormValues["priority"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{t("timeline.priorityLow")}</SelectItem>
                  <SelectItem value="medium">{t("timeline.priorityMedium")}</SelectItem>
                  <SelectItem value="high">{t("timeline.priorityHigh")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>{t("timeline.status")}</Label>
              <Select defaultValue={task?.status ?? "not_started"} onValueChange={(v) => setValue("status", v as TaskFormValues["status"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">{t("timeline.statusNotStarted")}</SelectItem>
                  <SelectItem value="in_progress">{t("timeline.statusInProgress")}</SelectItem>
                  <SelectItem value="completed">{t("timeline.statusCompleted")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
