import { z } from "zod";

export const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  due_date: z.string().optional().nullable(),
  status: z.enum(["not_started", "in_progress", "completed"]).default("not_started"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  sort_order: z.number().int().default(0),
});

export type TaskFormValues = z.infer<typeof taskSchema>;
