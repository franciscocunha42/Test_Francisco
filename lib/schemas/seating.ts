import { z } from "zod";

export const seatingTableSchema = z.object({
  name: z.string().min(1, "Table name is required"),
  capacity: z.coerce
    .number({ invalid_type_error: "Capacity must be a number" })
    .int("Capacity must be a whole number")
    .min(1, "Capacity must be at least 1")
    .max(50, "Capacity must be 50 or fewer"),
  notes: z.string().optional().nullable(),
  sort_order: z.number().optional(),
});

export type SeatingTableFormValues = z.infer<typeof seatingTableSchema>;
