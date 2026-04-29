import { z } from "zod";

export const weddingSchema = z.object({
  name: z.string().min(1, "Wedding name is required"),
  partner_one_name: z.string().min(1, "Partner one name is required"),
  partner_two_name: z.string().min(1, "Partner two name is required"),
  wedding_date: z.string().optional().nullable(),
  venue_name: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  total_budget: z.coerce.number().min(0, "Budget must be 0 or more"),
  currency: z.string().min(1).max(3).default("USD"),
});

export type WeddingFormValues = z.infer<typeof weddingSchema>;
