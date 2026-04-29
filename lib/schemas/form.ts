import { z } from "zod";

export const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().nullable(),
  type: z.enum(["rsvp", "dietary", "song_request", "travel", "custom"]).default("custom"),
  is_active: z.boolean().default(true),
});

export type FormFormValues = z.infer<typeof formSchema>;

export const formQuestionSchema = z.object({
  question_text: z.string().min(1, "Question text is required"),
  question_type: z.enum(["text", "textarea", "select", "checkbox", "radio", "email", "phone"]).default("text"),
  options_json: z.array(z.string()).optional().nullable(),
  required: z.boolean().default(false),
  sort_order: z.number().int().default(0),
});

export type FormQuestionFormValues = z.infer<typeof formQuestionSchema>;
