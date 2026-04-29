import { z } from "zod";

export const guestSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email").optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable(),
  party_name: z.string().optional().nullable(),
  invitation_status: z.enum(["not_sent", "sent", "opened", "responded"]).default("not_sent"),
  rsvp_status: z.enum(["pending", "attending", "not_attending"]).default("pending"),
  meal_choice: z.string().optional().nullable(),
  dietary_requirements: z.string().optional().nullable(),
  plus_one_allowed: z.boolean().default(false),
  plus_one_name: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type GuestFormValues = z.infer<typeof guestSchema>;
