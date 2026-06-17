"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { Calendar, Plus, Wand2, List, GanttChartSquare, X } from "lucide-react";
import { GuestAppShell } from "@/components/GuestAppShell";
import { TimelineTaskCard } from "@/components/TimelineTaskCard";
import { TaskFormDialog } from "@/components/TaskFormDialog";
import { InlineTaskCreator } from "@/components/InlineTaskCreator";
import { TimelineGantt } from "@/components/TimelineGantt";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { DEFAULT_BUDGET_CATEGORY_NAMES } from "@/lib/utils/budget-categories";
import { useGuestStore } from "@/lib/guest-store/store";
import { useT } from "@/lib/i18n/provider";
import type { TranslationKey } from "@/lib/i18n/dictionary";

const STATUS_VALUES = ["not_started", "in_progress", "completed"] as const;
const PRIORITY_VALUES = ["high", "medium", "low"] as const;
type Status = (typeof STATUS_VALUES)[number];
type Priority = (typeof PRIORITY_VALUES)[number];

const STATUS_LABEL_KEYS: Record<Status, TranslationKey> = {
  not_started: "timeline.statusNotStarted",
  in_progress: "timeline.statusInProgress",
  completed: "timeline.statusCompleted",
};

const PRIORITY_LABEL_KEYS: Record<Priority, TranslationKey> = {
  low: "timeline.priorityLow",
  medium: "timeline.priorityMedium",
  high: "timeline.priorityHigh",
};

export default function GuestTimelinePage() {
  const router = useRouter();
  const t = useT();
  const wedding = useGuestStore((s) => s.wedding);
  const tasks = useGuestStore((s) => s.tasks);
  const budgetCategories = useGuestStore((s) => s.budgetCategories);
  const createTask = useGuestStore((s) => s.createTask);
  const updateTask = useGuestStore((s) => s.updateTask);
  const deleteTask = useGuestStore((s) => s.deleteTask);
  const generateDefaults = useGuestStore((s) => s.generateDefaultTasks);

  const [statusFilter, setStatusFilter] = useState<Status[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<Priority[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [view, setView] = useState<"list" | "gantt">("list");

  useEffect(() => {
    if (!wedding) router.replace("/plan");
  }, [wedding, router]);

  const categoryOptions = useMemo(() => {
    const set = new Set<string>(DEFAULT_BUDGET_CATEGORY_NAMES);
    budgetCategories.forEach((c) => c.name && set.add(c.name));
    tasks.forEach((t) => { if (t.category) set.add(t.category); });
    return Array.from(set);
  }, [budgetCategories, tasks]);

  if (!wedding) return null;

  const filtered = tasks.filter((t) => {
    if (statusFilter.length > 0 && !statusFilter.includes(t.status as Status)) return false;
    if (priorityFilter.length > 0 && !priorityFilter.includes(t.priority as Priority)) return false;
    if (categoryFilter.length > 0 && (!t.category || !categoryFilter.includes(t.category))) return false;
    return true;
  });

  const grouped: Record<string, typeof tasks> = {};
  for (const task of filtered) {
    const key = task.due_date ? format(parseISO(task.due_date), "MMMM yyyy") : t("timeline.noDate");
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(task);
  }

  const completed = tasks.filter((t) => t.status === "completed").length;
  const filtersActive =
    statusFilter.length > 0 || priorityFilter.length > 0 || categoryFilter.length > 0;

  return (
    <GuestAppShell>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl font-semibold">{t("timeline.title")}</h1>
            <p className="text-sm text-muted-foreground">
              {tasks.length > 0 ? `${completed} / ${tasks.length} ${t("timeline.completed")}` : t("timeline.subtitle")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ViewToggle view={view} onChange={setView} t={t} />
            {tasks.length === 0 && wedding.wedding_date && (
              <Button variant="outline" size="sm" onClick={() => generateDefaults()}>
                <Wand2 className="mr-1.5 h-3.5 w-3.5" />{t("timeline.generate")}
              </Button>
            )}
            <TaskFormDialog
              weddingId="guest"
              categories={categoryOptions}
              onSubmit={async (data) => { createTask(data); return { ok: true }; }}
              trigger={<Button size="sm"><Plus className="mr-1.5 h-3.5 w-3.5" />{t("timeline.addTask")}</Button>}
            />
          </div>
        </div>

        <div className={cn("space-y-2", view === "gantt" && "hidden")}>
          <FilterRow
            label={t("timeline.status")}
            options={STATUS_VALUES.map((s) => ({ value: s, label: t(STATUS_LABEL_KEYS[s]) }))}
            selected={statusFilter}
            onToggle={(v) => toggleInList(setStatusFilter, v as Status)}
          />
          <FilterRow
            label={t("timeline.priority")}
            options={PRIORITY_VALUES.map((p) => ({ value: p, label: t(PRIORITY_LABEL_KEYS[p]) }))}
            selected={priorityFilter}
            onToggle={(v) => toggleInList(setPriorityFilter, v as Priority)}
          />
          <FilterRow
            label={t("timeline.category")}
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
              {t("timeline.clearFilters")}
            </button>
          )}
        </div>

        {view === "list" && (
          <InlineTaskCreator
            weddingId="guest"
            categories={categoryOptions}
            onSubmit={async (data) => { createTask(data); return { ok: true }; }}
          />
        )}

        {view === "gantt" ? (
          <TimelineGantt tasks={tasks} weddingDate={wedding.wedding_date} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title={filtersActive ? t("timeline.noMatchTitle") : t("timeline.emptyTitle")}
            description={filtersActive ? t("timeline.noMatchDesc") : t("timeline.emptyDesc")}
            action={
              <div className="flex gap-2">
                {wedding.wedding_date && (
                  <Button variant="outline" onClick={() => generateDefaults()}>
                    <Wand2 className="mr-1.5 h-4 w-4" />{t("timeline.generate")}
                  </Button>
                )}
                <TaskFormDialog
                  weddingId="guest"
                  categories={categoryOptions}
                  onSubmit={async (data) => { createTask(data); return { ok: true }; }}
                  trigger={<Button><Plus className="mr-1.5 h-4 w-4" />{t("timeline.addTask")}</Button>}
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

function ViewToggle({ view, onChange, t }: { view: "list" | "gantt"; onChange: (v: "list" | "gantt") => void; t: (key: TranslationKey) => string }) {
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
        <List className="h-3.5 w-3.5" /> {t("timeline.viewList")}
      </button>
      <button
        type="button"
        onClick={() => onChange("gantt")}
        className={cn(
          "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
          view === "gantt" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
        )}
      >
        <GanttChartSquare className="h-3.5 w-3.5" /> {t("timeline.viewGantt")}
      </button>
    </div>
  );
}
