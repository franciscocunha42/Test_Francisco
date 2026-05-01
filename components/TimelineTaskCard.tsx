"use client";

import { useState } from "react";
import { Check, Pencil, Trash2, Clock } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/format";
import { deleteTask, updateTask } from "@/lib/actions/timeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TaskFormDialog } from "@/components/TaskFormDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import type { TimelineTask } from "@/lib/types/database";

type TaskStatus = "not_started" | "in_progress" | "completed";

const priorityColors: Record<string, string> = {
  high: "destructive",
  medium: "warning",
  low: "secondary",
};

const NEXT_STATUS: Record<TaskStatus, TaskStatus> = {
  not_started: "in_progress",
  in_progress: "completed",
  completed: "not_started",
};

import type { TaskFormValues } from "@/lib/schemas/timeline";

interface TimelineTaskCardProps {
  task: TimelineTask;
  weddingId: string;
  onToggle?: (taskId: string, newStatus: TaskStatus) => void;
  /** When provided, replace the default server-action calls. Used by
   *  guest mode to write into the local store. */
  onUpdate?: (taskId: string, patch: Partial<TimelineTask>) => Promise<{ ok: boolean; error?: string }>;
  onDelete?: (taskId: string) => Promise<{ ok: boolean; error?: string }>;
  onEditSubmit?: (data: TaskFormValues, existing?: TimelineTask) => Promise<{ ok: boolean; error?: string }>;
}

export function TimelineTaskCard({ task, weddingId, onToggle, onUpdate, onDelete, onEditSubmit }: TimelineTaskCardProps) {
  const [status, setStatus] = useState<TaskStatus>(task.status as TaskStatus);
  const [pending, setPending] = useState(false);
  const done = status === "completed";
  const inProgress = status === "in_progress";

  async function handleToggle() {
    if (pending) return;
    const previous = status;
    const next = NEXT_STATUS[previous];

    setStatus(next);
    onToggle?.(task.id, next);
    setPending(true);

    const result = onUpdate
      ? await onUpdate(task.id, { status: next })
      : await updateTask(weddingId, task.id, { status: next });
    setPending(false);

    if (result?.ok === false) {
      setStatus(previous);
      onToggle?.(task.id, previous);
      toast.error(result.error ?? "Failed to update task");
    }
  }

  async function handleDelete() {
    const result = onDelete
      ? await onDelete(task.id)
      : await deleteTask(weddingId, task.id);
    if (result?.ok === false) toast.error(result.error);
    else toast.success("Task deleted");
  }

  const ariaLabel =
    status === "not_started"
      ? "Mark in progress"
      : status === "in_progress"
        ? "Mark complete"
        : "Mark not started";

  return (
    <div className={cn("flex items-start gap-3 rounded-lg border bg-card p-4 transition-opacity", done && "opacity-60")}>
      <button
        onClick={handleToggle}
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all",
          done && "border-primary bg-primary text-primary-foreground",
          inProgress && "border-amber-500 bg-amber-500/10 text-amber-600",
          !done && !inProgress && "border-muted-foreground hover:border-primary",
          pending && "opacity-70"
        )}
        aria-label={ariaLabel}
        title={ariaLabel}
      >
        {done && <Check className="h-3 w-3" />}
        {inProgress && <Clock className="h-3 w-3" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium", done && "line-through text-muted-foreground")}>{task.title}</p>
        {task.description && <p className="mt-0.5 text-xs text-muted-foreground">{task.description}</p>}
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          {task.due_date && (
            <span className="text-xs text-muted-foreground">{formatDate(task.due_date)}</span>
          )}
          {task.category && (
            <Badge variant="outline" className="text-xs py-0">{task.category}</Badge>
          )}
          <Badge variant={priorityColors[task.priority] as "destructive" | "warning" | "secondary"} className="text-xs py-0">
            {task.priority}
          </Badge>
          {inProgress && (
            <Badge variant="info" className="text-xs py-0">In Progress</Badge>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <TaskFormDialog
          weddingId={weddingId}
          task={task}
          onSubmit={onEditSubmit}
          trigger={
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          }
        />
        <ConfirmDialog
          trigger={
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          }
          title="Delete task"
          description={`Delete "${task.title}"? This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
        />
      </div>
    </div>
  );
}
