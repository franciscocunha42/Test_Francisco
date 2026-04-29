import { subDays } from "date-fns";
import type { TaskPriority } from "@/lib/types/database";

interface DefaultTask {
  title: string;
  category: string;
  daysBeforeWedding: number;
  priority: TaskPriority;
}

const DEFAULT_TASKS: DefaultTask[] = [
  { title: "Set wedding budget",             category: "planning",      daysBeforeWedding: 365, priority: "high" },
  { title: "Choose and book venue",           category: "venue",         daysBeforeWedding: 300, priority: "high" },
  { title: "Hire wedding photographer",       category: "photography",   daysBeforeWedding: 270, priority: "high" },
  { title: "Choose catering",                 category: "catering",      daysBeforeWedding: 240, priority: "high" },
  { title: "Book DJ / live music",            category: "entertainment", daysBeforeWedding: 210, priority: "high" },
  { title: "Send save-the-dates",             category: "guests",        daysBeforeWedding: 180, priority: "medium" },
  { title: "Book florist / decorations",      category: "decor",         daysBeforeWedding: 150, priority: "medium" },
  { title: "Order wedding cake",              category: "catering",      daysBeforeWedding: 120, priority: "medium" },
  { title: "Send formal invitations",         category: "guests",        daysBeforeWedding: 90,  priority: "high" },
  { title: "Confirm guest list & headcount",  category: "guests",        daysBeforeWedding: 60,  priority: "high" },
  { title: "Final dress / suit fitting",      category: "attire",        daysBeforeWedding: 30,  priority: "high" },
  { title: "Confirm supplier arrival times",  category: "logistics",     daysBeforeWedding: 14,  priority: "high" },
  { title: "Finalize seating plan",           category: "guests",        daysBeforeWedding: 10,  priority: "medium" },
  { title: "Prepare ceremony script / vows",  category: "ceremony",      daysBeforeWedding: 21,  priority: "medium" },
];

export function generateDefaultTasks(weddingDate: Date, weddingId: string) {
  return DEFAULT_TASKS.map((t, i) => ({
    wedding_id: weddingId,
    title: t.title,
    category: t.category,
    due_date: subDays(weddingDate, t.daysBeforeWedding).toISOString().split("T")[0],
    status: "not_started" as const,
    priority: t.priority,
    sort_order: i + 1,
    description: null,
    completed_at: null,
    assigned_to: null,
  }));
}
