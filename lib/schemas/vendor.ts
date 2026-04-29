import { z } from "zod";

export const vendorSchema = z.object({
  name: z.string().min(1, "Vendor name is required"),
  category: z.enum([
    "venue", "catering", "dj", "music", "photography", "videography",
    "flowers", "cake", "transport", "makeup", "dress", "suit",
    "stationery", "other",
  ]).default("other"),
  contact_name: z.string().optional().nullable(),
  email: z.string().email("Invalid email").optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable(),
  website: z.string().url("Invalid URL").optional().nullable().or(z.literal("")),
  quoted_price: z.coerce.number().min(0).optional().nullable(),
  actual_cost: z.coerce.number().min(0).optional().nullable(),
  status: z.enum(["researching", "contacted", "shortlisted", "booked", "rejected"]).default("researching"),
  notes: z.string().optional().nullable(),
});

export type VendorFormValues = z.infer<typeof vendorSchema>;
