"use client";

import { useEffect, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { generateDefaultTimelineTasks } from "@/lib/actions/timeline";
import { TimelineTaskCard } from "@/components/TimelineTaskCard";
import { TaskFormDialog } from "@/components/TaskFormDialog";
import { TimelineGantt } from "@/components/TimelineGantt";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Plus, Wand2, List, GanttChartSquare } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/badge";
import type { TimelineTask } from "@/lib/types/database";
import { format, parseISO } from "date-fns";

const STATUS_OPTIONS = ["all", "not_started", "in_progress", "completed"] as const;
const PRIORITY_OPTIONS = ["all", "high", "medium", "low"] as const;

export default function TimelinePage({ params }: { params: { weddingId: string } }) {
  const { weddingId } = params;
  const supabase = createClient();
  const [tasks, setTasks] = useState<TimelineTask[]>([]);
  const [weddingDate, setWeddingDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [view, setView] = useState<"list" | "gantt">("list");
  const [generating, startGenerating] = useTransition();

  async function fetchTasks() {
    const [tasksRes, weddingRes] = await Promise.all([
      supabase
        .from("timeline_tasks")
        .select("*")
        .eq("wedding_id", weddingId)
        .order("due_date", { ascending: true, nullsFirst: false }),
      supabase.from("weddings").select("wedding_date").eq("id", weddingId).single(),
    ]);
    setTasks(tasksRes.data ?? []);
    setWeddingDate(weddingRes.data?.wedding_date ?? null);
    setLoading(false);
  }

  useEffect(() => { fetchTasks(); }, [weddingId]);

  function handleTaskToggle(taskId: string, newStatus: "not_started" | "in_progress" | "completed") {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
  }

  async function handleGenerate() {
    startGenerating(async () => {
      const result = await generateDefaultTimelineTasks(weddingId);
      if (result?.ok === false) toast.error(result.error);
      else { toast.success("Default tasks added"); fetchTasks(); }
    });
  }

  const filtered = tasks.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
    return true;
  });

  // Group by month
  const grouped: Record<string, TimelineTask[]> = {};
  for (const task of filtered) {
    const key = task.due_date
      ? format(parseISO(task.due_date), "MMMM yyyy")
      : "No date";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(task);
  }

  const completed = tasks.filter((t) => t.status === "completed").length;

  return (
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
          {tasks.length === 0 && (
            <Button variant="outline" size="sm" onClick={handleGenerate} disabled={generating}>
              <Wand2 className="mr-1.5 h-3.5 w-3.5" />
              {generating ? "Generating..." : "Generate tasks"}
            </Button>
          )}
          <TaskFormDialog
            weddingId={weddingId}
            trigger={<Button size="sm"><Plus className="mr-1.5 h-3.5 w-3.5" />Add Task</Button>}
          />
        </div>
      </div>

      {/* Filters */}
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

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : view === "gantt" ? (
        <TimelineGantt tasks={tasks} weddingDate={weddingDate} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No tasks yet"
          description="Add tasks manually or generate a default wedding checklist."
          action={
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleGenerate} disabled={generating}>
                <Wand2 className="mr-1.5 h-4 w-4" />{generating ? "Generating..." : "Generate tasks"}
              </Button>
              <TaskFormDialog weddingId={weddingId} trigger={<Button><Plus className="mr-1.5 h-4 w-4" />Add Task</Button>} />
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
                  <TimelineTaskCard key={task.id} task={task} weddingId={weddingId} onToggle={handleTaskToggle} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
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
