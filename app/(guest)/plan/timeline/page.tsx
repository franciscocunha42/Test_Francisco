"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { Calendar, Plus, Wand2, List, GanttChartSquare } from "lucide-react";
import { GuestAppShell } from "@/components/GuestAppShell";
import { TimelineTaskCard } from "@/components/TimelineTaskCard";
import { TaskFormDialog } from "@/components/TaskFormDialog";
import { TimelineGantt } from "@/components/TimelineGantt";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { useGuestStore } from "@/lib/guest-store/store";
import { useState } from "react";

const STATUS_OPTIONS = ["all", "not_started", "in_progress", "completed"] as const;
const PRIORITY_OPTIONS = ["all", "high", "medium", "low"] as const;

export default function GuestTimelinePage() {
  const router = useRouter();
  const wedding = useGuestStore((s) => s.wedding);
  const tasks = useGuestStore((s) => s.tasks);
  const createTask = useGuestStore((s) => s.createTask);
  const updateTask = useGuestStore((s) => s.updateTask);
  const deleteTask = useGuestStore((s) => s.deleteTask);
  const generateDefaults = useGuestStore((s) => s.generateDefaultTasks);

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [view, setView] = useState<"list" | "gantt">("list");

  useEffect(() => {
    if (!wedding) router.replace("/plan");
  }, [wedding, router]);

  if (!wedding) return null;

  const filtered = tasks.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
    return true;
  });

  const grouped: Record<string, typeof tasks> = {};
  for (const task of filtered) {
    const key = task.due_date ? format(parseISO(task.due_date), "MMMM yyyy") : "No date";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(task);
  }

  const completed = tasks.filter((t) => t.status === "completed").length;

  return (
    <GuestAppShell>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl font-semibold">Timeline</h1>
            <p className="text-sm text-muted-foreground">
              {tasks.length > 0 ? `${completed} / ${tasks.length} tasks completed` : "Track your wedding preparation tasks"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ViewToggle view={view} onChange={setView} />
            {tasks.length === 0 && wedding.wedding_date && (
              <Button variant="outline" size="sm" onClick={() => generateDefaults()}>
                <Wand2 className="mr-1.5 h-3.5 w-3.5" />Generate tasks
              </Button>
            )}
            <TaskFormDialog
              weddingId="guest"
              onSubmit={async (data) => { createTask(data); return { ok: true }; }}
              trigger={<Button size="sm"><Plus className="mr-1.5 h-3.5 w-3.5" />Add Task</Button>}
            />
          </div>
        </div>

        <div className={cn("flex flex-wrap gap-2", view === "gantt" && "hidden")}>
          <div className="flex flex-wrap gap-1">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors capitalize ${statusFilter === s ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}
              >
                {s === "all" ? "All Status" : s.replace("_", " ")}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            {PRIORITY_OPTIONS.map((p) => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors capitalize ${priorityFilter === p ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}
              >
                {p === "all" ? "All Priority" : p}
              </button>
            ))}
          </div>
        </div>

        {view === "gantt" ? (
          <TimelineGantt tasks={tasks} weddingDate={wedding.wedding_date} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No tasks yet"
            description="Add tasks manually or generate a default wedding checklist."
            action={
              <div className="flex gap-2">
                {wedding.wedding_date && (
                  <Button variant="outline" onClick={() => generateDefaults()}>
                    <Wand2 className="mr-1.5 h-4 w-4" />Generate tasks
                  </Button>
                )}
                <TaskFormDialog
                  weddingId="guest"
                  onSubmit={async (data) => { createTask(data); return { ok: true }; }}
                  trigger={<Button><Plus className="mr-1.5 h-4 w-4" />Add Task</Button>}
                />
              </div>
            }
          />
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([month, monthTasks]) => (
              <div key={month}>
                <h2 className="mb-3 text-sm font-semibold text-muted-foreground">{month}</h2>
                <div className="space-y-2">
                  {monthTasks.map((task) => (
                    <TimelineTaskCard
                      key={task.id}
                      task={task}
                      weddingId="guest"
                      onUpdate={async (id, patch) => { updateTask(id, patch); return { ok: true }; }}
                      onDelete={async (id) => { deleteTask(id); return { ok: true }; }}
                      onEditSubmit={async (data, existing) => {
                        if (existing) updateTask(existing.id, data);
                        return { ok: true };
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </GuestAppShell>
  );
}

function ViewToggle({ view, onChange }: { view: "list" | "gantt"; onChange: (v: "list" | "gantt") => void }) {
  return (
    <div className="inline-flex items-center rounded-lg border bg-muted/40 p-0.5">
      <button
        type="button"
        onClick={() => onChange("list")}
        className={cn(
          "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
          view === "list" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
        )}
      >
        <List className="h-3.5 w-3.5" /> List
      </button>
      <button
        type="button"
        onClick={() => onChange("gantt")}
        className={cn(
          "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
          view === "gantt" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
        )}
      >
        <GanttChartSquare className="h-3.5 w-3.5" /> Gantt
      </button>
    </div>
  );
}
