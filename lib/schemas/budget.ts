import { z } from "zod";

export const budgetCategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  planned_amount: z.coerce.number().min(0).default(0),
});

export type BudgetCategoryFormValues = z.infer<typeof budgetCategorySchema>;

export const expenseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  category_id: z.string().uuid().optional().nullable(),
  vendor_id: z.string().uuid().optional().nullable(),
  planned_amount: z.coerce.number().min(0).default(0),
  actual_amount: z.coerce.number().min(0).default(0),
  payment_status: z.enum(["unpaid", "deposit_paid", "partially_paid", "paid"]).default("unpaid"),
  due_date: z.string().optional().nullable(),
  paid_date: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type ExpenseFormValues = z.infer<typeof expenseSchema>;
