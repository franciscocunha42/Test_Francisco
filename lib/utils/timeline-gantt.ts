import type { TaskPriority } from "@/lib/types/database";

export interface GanttTopic {
  key: string;
  title: string;
  category: string;
  daysBeforeWedding: number;
  durationDays: number;
  priority: TaskPriority;
  dependsOn: string[];
}

// Default wedding-planning topics with durations and dependencies.
// Used to (a) seed the Gantt chart, (b) enrich user tasks that match by title,
// and (c) compute the critical path.
export const DEFAULT_TIMELINE_TOPICS: GanttTopic[] = [
  { key: "budget",         title: "Set wedding budget",             category: "planning",      daysBeforeWedding: 365, durationDays: 14, priority: "high",   dependsOn: [] },
  { key: "venue",          title: "Choose and book venue",          category: "venue",         daysBeforeWedding: 300, durationDays: 30, priority: "high",   dependsOn: ["budget"] },
  { key: "photography",    title: "Hire wedding photographer",      category: "photography",   daysBeforeWedding: 270, durationDays: 21, priority: "high",   dependsOn: ["venue"] },
  { key: "catering",       title: "Choose catering",                category: "catering",      daysBeforeWedding: 240, durationDays: 21, priority: "high",   dependsOn: ["venue"] },
  { key: "entertainment",  title: "Book DJ / live music",           category: "entertainment", daysBeforeWedding: 210, durationDays: 21, priority: "high",   dependsOn: ["venue"] },
  { key: "save-the-dates", title: "Send save-the-dates",            category: "guests",        daysBeforeWedding: 180, durationDays: 14, priority: "medium", dependsOn: ["venue"] },
  { key: "florist",        title: "Book florist / decorations",     category: "decor",         daysBeforeWedding: 150, durationDays: 21, priority: "medium", dependsOn: ["venue"] },
  { key: "cake",           title: "Order wedding cake",             category: "catering",      daysBeforeWedding: 120, durationDays: 14, priority: "medium", dependsOn: ["catering"] },
  { key: "invitations",    title: "Send formal invitations",        category: "guests",        daysBeforeWedding:  90, durationDays: 14, priority: "high",   dependsOn: ["save-the-dates"] },
  { key: "headcount",      title: "Confirm guest list & headcount", category: "guests",        daysBeforeWedding:  60, durationDays: 14, priority: "high",   dependsOn: ["invitations"] },
  { key: "fitting",        title: "Final dress / suit fitting",     category: "attire",        daysBeforeWedding:  30, durationDays:  7, priority: "high",   dependsOn: ["venue"] },
  { key: "vows",           title: "Prepare ceremony script / vows", category: "ceremony",      daysBeforeWedding:  21, durationDays: 14, priority: "medium", dependsOn: ["venue"] },
  { key: "supplier-times", title: "Confirm supplier arrival times", category: "logistics",     daysBeforeWedding:  14, durationDays:  7, priority: "high",   dependsOn: ["catering", "photography", "entertainment", "florist"] },
  { key: "seating",        title: "Finalize seating plan",          category: "guests",        daysBeforeWedding:  10, durationDays:  5, priority: "medium", dependsOn: ["headcount"] },
];

export const DEFAULT_DURATION_DAYS = 14;

// Returns the set of topic keys on the critical path —
// the longest chain (by summed durationDays) ending at any leaf topic.
export function computeCriticalPath(topics: GanttTopic[]): Set<string> {
  const byKey = new Map(topics.map((t) => [t.key, t]));
  const memo = new Map<string, { length: number; trace: string[] }>();

  function dfs(key: string): { length: number; trace: string[] } {
    const cached = memo.get(key);
    if (cached) return cached;
    const t = byKey.get(key);
    if (!t) {
      const r = { length: 0, trace: [] };
      memo.set(key, r);
      return r;
    }
    if (t.dependsOn.length === 0) {
      const r = { length: t.durationDays, trace: [key] };
      memo.set(key, r);
      return r;
    }
    let best: { length: number; trace: string[] } = { length: 0, trace: [] };
    for (const dep of t.dependsOn) {
      const sub = dfs(dep);
      if (sub.length > best.length) best = sub;
    }
    const r = { length: best.length + t.durationDays, trace: [...best.trace, key] };
    memo.set(key, r);
    return r;
  }

  let bestOverall: { length: number; trace: string[] } = { length: 0, trace: [] };
  for (const t of topics) {
    const r = dfs(t.key);
    if (r.length > bestOverall.length) bestOverall = r;
  }
  return new Set(bestOverall.trace);
}

const TOPIC_KEYWORDS: Record<string, string[]> = {
  "budget":         ["budget"],
  "venue":          ["venue"],
  "photography":    ["photograph", "videograph"],
  "catering":       ["catering", "caterer"],
  "entertainment":  ["dj", " music", "band", "entertainment"],
  "save-the-dates": ["save-the-date", "save the date"],
  "florist":        ["florist", "flower", "decor"],
  "cake":           ["cake"],
  "invitations":    ["invitation"],
  "headcount":      ["headcount", "guest list"],
  "fitting":        ["fitting", "dress", "suit"],
  "vows":           ["vow", "ceremony script"],
  "supplier-times": ["arrival time", "supplier arrival"],
  "seating":        ["seating"],
};

export function matchTopicForTask(
  title: string,
  topics: GanttTopic[] = DEFAULT_TIMELINE_TOPICS,
): GanttTopic | null {
  const lower = title.trim().toLowerCase();
  for (const t of topics) {
    if (t.title.toLowerCase() === lower) return t;
  }
  for (const t of topics) {
    const kws = TOPIC_KEYWORDS[t.key] ?? [];
    if (kws.some((k) => lower.includes(k))) return t;
  }
  return null;
}
