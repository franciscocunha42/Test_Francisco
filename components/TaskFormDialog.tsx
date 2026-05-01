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
import type { TimelineTask } from "@/lib/types/database";

interface TaskFormDialogProps {
  weddingId: string;
  task?: TimelineTask;
  trigger: React.ReactNode;
  onSubmit?: (data: TaskFormValues, existing?: TimelineTask) => Promise<{ ok: boolean; error?: string }>;
}

export function TaskFormDialog({ weddingId, task, trigger, onSubmit: onSubmitProp }: TaskFormDialogProps) {
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: task ?? { status: "not_started", priority: "medium" },
  });

  async function onSubmit(data: TaskFormValues) {
    const result = onSubmitProp
      ? await onSubmitProp(data, task)
      : task
        ? await updateTask(weddingId, task.id, data)
        : await createTask(weddingId, data);
    if (result?.ok === false) { toast.error(result.error); return; }
    toast.success(task ? "Task updated" : "Task created");
    setOpen(false);
    reset();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{task ? "Edit Task" : "New Task"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label>Title *</Label>
            <Input {...register("title")} placeholder="e.g. Book florist" />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea {...register("description")} placeholder="Optional notes..." rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Category</Label>
              <Input {...register("category")} placeholder="e.g. venue" />
            </div>
            <div className="space-y-1">
              <Label>Due Date</Label>
              <Input type="date" {...register("due_date")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Priority</Label>
              <Select defaultValue={task?.priority ?? "medium"} onValueChange={(v) => setValue("priority", v as TaskFormValues["priority"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select defaultValue={task?.status ?? "not_started"} onValueChange={(v) => setValue("status", v as TaskFormValues["status"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">Not Started</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
