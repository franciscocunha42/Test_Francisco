"use client";

import { useState } from "react";
import { Check, Pencil, Trash2, Circle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/format";
import { completeTask, deleteTask, updateTask } from "@/lib/actions/timeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TaskFormDialog } from "@/components/TaskFormDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import type { TimelineTask } from "@/lib/types/database";

const priorityColors: Record<string, string> = {
  high: "destructive",
  medium: "warning",
  low: "secondary",
};

interface TimelineTaskCardProps {
  task: TimelineTask;
  weddingId: string;
}

export function TimelineTaskCard({ task, weddingId }: TimelineTaskCardProps) {
  const [completing, setCompleting] = useState(false);
  const done = task.status === "completed";

  async function handleToggle() {
    setCompleting(true);
    const newStatus = done ? "not_started" : "completed";
    const result = await updateTask(weddingId, task.id, { status: newStatus });
    if (result?.ok === false) toast.error(result.error);
    setCompleting(false);
  }

  async function handleDelete() {
    const result = await deleteTask(weddingId, task.id);
    if (result?.ok === false) toast.error(result.error);
    else toast.success("Task deleted");
  }

  return (
    <div className={cn("flex items-start gap-3 rounded-lg border bg-card p-4 transition-opacity", done && "opacity-60")}>
      <button
        onClick={handleToggle}
        disabled={completing}
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          done
            ? "border-primary bg-primary text-primary-foreground"
            : "border-muted-foreground hover:border-primary"
        )}
        aria-label={done ? "Mark incomplete" : "Mark complete"}
      >
        {done && <Check className="h-3 w-3" />}
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
          {task.status === "in_progress" && (
            <Badge variant="info" className="text-xs py-0">In Progress</Badge>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <TaskFormDialog
          weddingId={weddingId}
          task={task}
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
