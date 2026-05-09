"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { generateDefaultTimelineTasks } from "@/lib/actions/timeline";
import { TimelineTaskCard } from "@/components/TimelineTaskCard";
import { TaskFormDialog } from "@/components/TaskFormDialog";
import { TimelineGantt } from "@/components/TimelineGantt";
import { InlineTaskCreator } from "@/components/InlineTaskCreator";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Plus, Wand2, List, GanttChartSquare, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import { DEFAULT_BUDGET_CATEGORY_NAMES } from "@/lib/utils/budget-categories";
import type { TimelineTask, BudgetCategory } from "@/lib/types/database";
import { format, parseISO } from "date-fns";

const STATUS_VALUES = ["not_started", "in_progress", "completed"] as const;
const PRIORITY_VALUES = ["high", "medium", "low"] as const;
type Status = (typeof STATUS_VALUES)[number];
type Priority = (typeof PRIORITY_VALUES)[number];

export default function TimelinePage({ params }: { params: { weddingId: string } }) {
  const { weddingId } = params;
  const supabase = createClient();
  const [tasks, setTasks] = useState<TimelineTask[]>([]);
  const [budgetCategories, setBudgetCategories] = useState<Pick<BudgetCategory, "name">[]>([]);
  const [weddingDate, setWeddingDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<Status[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<Priority[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [view, setView] = useState<"list" | "gantt">("list");
  const [generating, startGenerating] = useTransition();

  async function fetchTasks() {
    const [tasksRes, weddingRes, catRes] = await Promise.all([
      supabase
        .from("timeline_tasks")
        .select("*")
        .eq("wedding_id", weddingId)
        .order("due_date", { ascending: true, nullsFirst: false }),
      supabase.from("weddings").select("wedding_date").eq("id", weddingId).single(),
      supabase.from("budget_categories").select("name").eq("wedding_id", weddingId),
    ]);
    setTasks(tasksRes.data ?? []);
    setBudgetCategories(catRes.data ?? []);
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

  const categoryOptions = useMemo(() => {
    const set = new Set<string>(DEFAULT_BUDGET_CATEGORY_NAMES);
    budgetCategories.forEach((c) => c.name && set.add(c.name));
    tasks.forEach((t) => { if (t.category) set.add(t.category); });
    return Array.from(set);
  }, [budgetCategories, tasks]);

  const filtered = tasks.filter((t) => {
    if (statusFilter.length > 0 && !statusFilter.includes(t.status as Status)) return false;
    if (priorityFilter.length > 0 && !priorityFilter.includes(t.priority as Priority)) return false;
    if (categoryFilter.length > 0 && (!t.category || !categoryFilter.includes(t.category))) return false;
    return true;
  });

  const grouped: Record<string, TimelineTask[]> = {};
  for (const task of filtered) {
    const key = task.due_date
      ? format(parseISO(task.due_date), "MMMM yyyy")
      : "No date";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(task);
  }

  const completed = tasks.filter((t) => t.status === "completed").length;
  const filtersActive =
    statusFilter.length > 0 || priorityFilter.length > 0 || categoryFilter.length > 0;

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
            categories={categoryOptions}
            trigger={<Button size="sm"><Plus className="mr-1.5 h-3.5 w-3.5" />Add Task</Button>}
          />
        </div>
      </div>

      {/* Filters */}
      <div className={cn("space-y-2", view === "gantt" && "hidden")}>
        <FilterRow
          label="Status"
          options={STATUS_VALUES.map((s) => ({ value: s, label: s.replace("_", " ") }))}
          selected={statusFilter}
          onToggle={(v) => toggleInList(setStatusFilter, v as Status)}
        />
        <FilterRow
          label="Priority"
          options={PRIORITY_VALUES.map((p) => ({ value: p, label: p }))}
          selected={priorityFilter}
          onToggle={(v) => toggleInList(setPriorityFilter, v as Priority)}
        />
        <FilterRow
          label="Category"
          options={categoryOptions.map((c) => ({ value: c, label: c }))}
          selected={categoryFilter}
          onToggle={(v) => toggleInList(setCategoryFilter, v)}
        />
        {filtersActive && (
          <button
            onClick={() => { setStatusFilter([]); setPriorityFilter([]); setCategoryFilter([]); }}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
            Clear filters
          </button>
        )}
      </div>

      {view === "list" && (
        <InlineTaskCreator weddingId={weddingId} categories={categoryOptions} onSuccess={fetchTasks} />
      )}

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : view === "gantt" ? (
        <TimelineGantt tasks={tasks} weddingDate={weddingDate} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title={filtersActive ? "No tasks match the current filters" : "No tasks yet"}
          description={filtersActive ? "Try clearing filters or adjusting your selection." : "Add tasks manually or generate a default wedding checklist."}
          action={
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleGenerate} disabled={generating}>
                <Wand2 className="mr-1.5 h-4 w-4" />{generating ? "Generating..." : "Generate tasks"}
              </Button>
              <TaskFormDialog weddingId={weddingId} categories={categoryOptions} trigger={<Button><Plus className="mr-1.5 h-4 w-4" />Add Task</Button>} />
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

function toggleInList<T extends string>(setter: (fn: (prev: T[]) => T[]) => void, value: T) {
  setter((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
}

function FilterRow<T extends string>({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: { value: T; label: string }[];
  selected: T[];
  onToggle: (value: T) => void;
}) {
  if (options.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      {options.map((o) => {
        const active = selected.includes(o.value);
        return (
          <button
            key={o.value}
            onClick={() => onToggle(o.value)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors capitalize",
              active
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border hover:bg-muted",
            )}
          >
            {o.label}
          </button>
        );
      })}
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
