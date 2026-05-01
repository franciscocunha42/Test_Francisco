"use client";

import { useMemo } from "react";
import { addDays, differenceInDays, format, parseISO, startOfMonth } from "date-fns";
import { cn } from "@/lib/utils/cn";
import {
  DEFAULT_DURATION_DAYS,
  DEFAULT_TIMELINE_TOPICS,
  computeCriticalPath,
  matchTopicForTask,
  type GanttTopic,
} from "@/lib/utils/timeline-gantt";
import type { TimelineTask } from "@/lib/types/database";

interface Props {
  tasks: TimelineTask[];
  weddingDate: string | null;
}

export function TimelineGantt({ tasks, weddingDate }: Props) {
  if (!weddingDate) {
    return (
      <div className="rounded-lg border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
        Set your wedding date in Settings to see the Gantt timeline.
      </div>
    );
  }
  return <GanttInner tasks={tasks} weddingDate={weddingDate} />;
}

interface Bar {
  rowKey: string;
  topic: GanttTopic | null;
  isGhost: boolean;
  title: string;
  category: string;
  status: "not_started" | "in_progress" | "completed";
  start: Date;
  end: Date;
  startDay: number;
  endDay: number;
  critical: boolean;
  rowIndex: number;
  topicKey: string | null;
}

const DAY_PX = 6;
const ROW_PX = 36;
const HEADER_PX = 36;
const LABEL_COL_PX = 224;

function GanttInner({ tasks, weddingDate }: { tasks: TimelineTask[]; weddingDate: string }) {
  const wedding = useMemo(() => parseISO(weddingDate), [weddingDate]);
  const criticalSet = useMemo(() => computeCriticalPath(DEFAULT_TIMELINE_TOPICS), []);

  const { bars, projectStart, projectEnd } = useMemo(
    () => buildBars(tasks, wedding, criticalSet),
    [tasks, wedding, criticalSet],
  );

  const totalDays = Math.max(1, differenceInDays(projectEnd, projectStart));
  const chartWidth = totalDays * DAY_PX;
  const chartHeight = bars.length * ROW_PX;

  const today = new Date();
  const todayDay = differenceInDays(today, projectStart);
  const todayInRange = todayDay >= 0 && todayDay <= totalDays;
  const weddingDay = differenceInDays(wedding, projectStart);
  const weddingInRange = weddingDay >= 0 && weddingDay <= totalDays;

  const monthMarkers = useMemo(() => {
    const markers: { day: number; label: string }[] = [];
    let cursor = startOfMonth(projectStart);
    while (cursor <= projectEnd) {
      markers.push({ day: differenceInDays(cursor, projectStart), label: format(cursor, "MMM yy") });
      cursor = startOfMonth(addDays(cursor, 32));
    }
    return markers;
  }, [projectStart, projectEnd]);

  const depEdges = useMemo(() => buildDepEdges(bars, criticalSet), [bars, criticalSet]);

  if (bars.length === 0) {
    return (
      <div className="rounded-lg border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
        No tasks with dates yet. Add tasks with due dates to see the Gantt.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Legend />
      <div className="overflow-x-auto rounded-lg border bg-card">
        <div className="flex">
          {/* Left column: task labels */}
          <div className="shrink-0 border-r bg-muted/30" style={{ width: LABEL_COL_PX }}>
            <div className="border-b px-3 py-2 text-xs font-semibold text-muted-foreground" style={{ height: HEADER_PX }}>
              Task
            </div>
            {bars.map((b) => (
              <div
                key={b.rowKey}
                className={cn(
                  "flex items-center gap-2 px-3 text-xs",
                  b.isGhost && "opacity-60",
                )}
                style={{ height: ROW_PX }}
              >
                {b.critical && (
                  <span
                    className="h-2 w-2 shrink-0 rounded-full bg-destructive"
                    title="On critical path"
                  />
                )}
                <span className="truncate" title={b.title}>
                  {b.title}
                </span>
              </div>
            ))}
          </div>

          {/* Right: scrollable chart */}
          <div className="relative" style={{ minWidth: chartWidth, width: chartWidth }}>
            {/* Month header */}
            <div className="relative border-b bg-muted/30" style={{ height: HEADER_PX }}>
              {monthMarkers.map((m, i) => (
                <div
                  key={i}
                  className="absolute top-0 h-full whitespace-nowrap border-l border-border/50 px-1.5 py-2 text-[11px] font-medium text-muted-foreground"
                  style={{ left: m.day * DAY_PX }}
                >
                  {m.label}
                </div>
              ))}
            </div>

            {/* Rows backdrop */}
            <div className="relative" style={{ height: chartHeight }}>
              {/* Vertical month gridlines */}
              {monthMarkers.map((m, i) => (
                <div
                  key={`g-${i}`}
                  className="absolute top-0 bottom-0 border-l border-border/30"
                  style={{ left: m.day * DAY_PX }}
                />
              ))}

              {/* Alternating row stripes */}
              {bars.map((b, i) =>
                i % 2 === 1 ? (
                  <div
                    key={`s-${b.rowKey}`}
                    className="absolute left-0 right-0 bg-muted/20"
                    style={{ top: i * ROW_PX, height: ROW_PX }}
                  />
                ) : null,
              )}

              {/* Today line */}
              {todayInRange && (
                <div
                  className="absolute top-0 bottom-0 z-10 w-px bg-destructive"
                  style={{ left: todayDay * DAY_PX }}
                  title={`Today: ${format(today, "MMM d, yyyy")}`}
                />
              )}

              {/* Wedding day line */}
              {weddingInRange && (
                <>
                  <div
                    className="absolute top-0 bottom-0 z-10 w-px bg-primary"
                    style={{ left: weddingDay * DAY_PX }}
                    title={`Wedding day: ${format(wedding, "MMM d, yyyy")}`}
                  />
                  <div
                    className="absolute z-10 -translate-x-1/2 rounded-sm bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground"
                    style={{ left: weddingDay * DAY_PX, top: 2 }}
                  >
                    Wedding
                  </div>
                </>
              )}

              {/* Bars */}
              {bars.map((b) => {
                const left = b.startDay * DAY_PX;
                const width = Math.max(8, (b.endDay - b.startDay) * DAY_PX);
                return (
                  <div
                    key={`b-${b.rowKey}`}
                    className="absolute"
                    style={{
                      top: b.rowIndex * ROW_PX + 5,
                      left,
                      width,
                      height: ROW_PX - 10,
                    }}
                  >
                    <div
                      className={cn(
                        "flex h-full items-center overflow-hidden rounded-md border px-1.5 text-[11px] font-medium shadow-sm",
                        b.status === "completed" &&
                          "border-primary bg-primary/80 text-primary-foreground line-through",
                        b.status === "in_progress" &&
                          "border-amber-400 bg-amber-100 text-amber-900",
                        b.status === "not_started" &&
                          !b.isGhost &&
                          "border-border bg-background text-foreground",
                        b.isGhost &&
                          "border-dashed border-muted-foreground/40 bg-muted/40 text-muted-foreground",
                        b.critical && "ring-2 ring-destructive/70",
                      )}
                      title={`${b.title} · ${format(b.start, "MMM d")} → ${format(b.end, "MMM d")}${
                        b.critical ? " · critical path" : ""
                      }${b.isGhost ? " · suggested" : ""}`}
                    >
                      <span className="truncate">{b.title}</span>
                    </div>
                  </div>
                );
              })}

              {/* Dependency arrows */}
              <svg
                className="pointer-events-none absolute inset-0 z-20"
                width={chartWidth}
                height={chartHeight}
              >
                <defs>
                  <marker
                    id="gantt-arrow"
                    viewBox="0 0 10 10"
                    refX="9"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto"
                  >
                    <path d="M0,0 L10,5 L0,10 Z" className="fill-muted-foreground" />
                  </marker>
                  <marker
                    id="gantt-arrow-crit"
                    viewBox="0 0 10 10"
                    refX="9"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto"
                  >
                    <path d="M0,0 L10,5 L0,10 Z" className="fill-destructive" />
                  </marker>
                </defs>
                {depEdges.map((e, i) => {
                  const fromX = e.from.endDay * DAY_PX;
                  const fromY = e.from.rowIndex * ROW_PX + ROW_PX / 2;
                  const toX = e.to.startDay * DAY_PX;
                  const toY = e.to.rowIndex * ROW_PX + ROW_PX / 2;
                  const pad = 6;
                  const midX = toX > fromX + pad * 2 ? toX - pad : fromX + pad;
                  const d = `M${fromX},${fromY} L${midX},${fromY} L${midX},${toY} L${toX - 2},${toY}`;
                  return (
                    <path
                      key={`e-${i}`}
                      d={d}
                      fill="none"
                      strokeWidth={e.critical ? 1.5 : 1}
                      className={cn(
                        e.critical ? "stroke-destructive" : "stroke-muted-foreground/60",
                      )}
                      markerEnd={
                        e.critical ? "url(#gantt-arrow-crit)" : "url(#gantt-arrow)"
                      }
                    />
                  );
                })}
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function buildBars(
  tasks: TimelineTask[],
  wedding: Date,
  criticalSet: Set<string>,
): { bars: Bar[]; projectStart: Date; projectEnd: Date } {
  const matchedTopicKeys = new Set<string>();
  const userBars: Bar[] = [];

  for (const task of tasks) {
    const topic = matchTopicForTask(task.title);
    const end = task.due_date
      ? parseISO(task.due_date)
      : topic
        ? addDays(wedding, -topic.daysBeforeWedding)
        : null;
    if (!end) continue;
    const duration = topic?.durationDays ?? DEFAULT_DURATION_DAYS;
    const start = addDays(end, -duration);
    if (topic) matchedTopicKeys.add(topic.key);
    userBars.push({
      rowKey: `t-${task.id}`,
      topic,
      isGhost: false,
      title: task.title,
      category: task.category ?? topic?.category ?? "other",
      status: task.status,
      start,
      end,
      startDay: 0,
      endDay: 0,
      critical: topic ? criticalSet.has(topic.key) : false,
      rowIndex: 0,
      topicKey: topic?.key ?? null,
    });
  }

  const ghostBars: Bar[] = DEFAULT_TIMELINE_TOPICS.filter(
    (t) => !matchedTopicKeys.has(t.key),
  ).map((topic) => {
    const end = addDays(wedding, -topic.daysBeforeWedding);
    const start = addDays(end, -topic.durationDays);
    return {
      rowKey: `g-${topic.key}`,
      topic,
      isGhost: true,
      title: topic.title,
      category: topic.category,
      status: "not_started" as const,
      start,
      end,
      startDay: 0,
      endDay: 0,
      critical: criticalSet.has(topic.key),
      rowIndex: 0,
      topicKey: topic.key,
    };
  });

  const allBars = [...userBars, ...ghostBars];
  if (allBars.length === 0) {
    return { bars: [], projectStart: wedding, projectEnd: wedding };
  }

  allBars.sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.start.getTime() - b.start.getTime();
  });
  allBars.forEach((b, i) => {
    b.rowIndex = i;
  });

  let projectStart = allBars[0].start;
  let projectEnd = wedding;
  for (const b of allBars) {
    if (b.start < projectStart) projectStart = b.start;
    if (b.end > projectEnd) projectEnd = b.end;
  }
  projectStart = startOfMonth(projectStart);
  projectEnd = addDays(projectEnd, 7);

  for (const b of allBars) {
    b.startDay = Math.max(0, differenceInDays(b.start, projectStart));
    b.endDay = differenceInDays(b.end, projectStart);
  }

  return { bars: allBars, projectStart, projectEnd };
}

function buildDepEdges(
  bars: Bar[],
  criticalSet: Set<string>,
): { from: Bar; to: Bar; critical: boolean }[] {
  const byKey = new Map<string, Bar[]>();
  for (const b of bars) {
    if (b.topicKey) {
      const list = byKey.get(b.topicKey) ?? [];
      list.push(b);
      byKey.set(b.topicKey, list);
    }
  }
  const edges: { from: Bar; to: Bar; critical: boolean }[] = [];
  for (const b of bars) {
    const topic = b.topic;
    if (!topic) continue;
    for (const depKey of topic.dependsOn) {
      const fromBars = byKey.get(depKey);
      if (!fromBars) continue;
      for (const from of fromBars) {
        edges.push({
          from,
          to: b,
          critical: criticalSet.has(depKey) && criticalSet.has(topic.key),
        });
      }
    }
  }
  return edges;
}

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
      <LegendSwatch className="border-border bg-background" label="Not started" />
      <LegendSwatch className="border-amber-400 bg-amber-100" label="In progress" />
      <LegendSwatch className="border-primary bg-primary/80" label="Completed" />
      <LegendSwatch
        className="border-dashed border-muted-foreground/40 bg-muted/40"
        label="Suggested"
      />
      <LegendSwatch
        className="border-border bg-background ring-2 ring-destructive/70"
        label="Critical path"
      />
      <div className="flex items-center gap-1.5">
        <span className="inline-block h-3 w-px bg-destructive" /> Today
      </div>
      <div className="flex items-center gap-1.5">
        <span className="inline-block h-3 w-px bg-primary" /> Wedding day
      </div>
    </div>
  );
}

function LegendSwatch({ className, label }: { className: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn("inline-block h-3 w-5 rounded-sm border", className)} />
      {label}
    </div>
  );
}
