import { describe, it, expect } from "vitest";
import { taskSchema } from "@/lib/schemas/timeline";
import { vendorSchema } from "@/lib/schemas/vendor";
import { guestSchema } from "@/lib/schemas/guest";
import { weddingSchema } from "@/lib/schemas/wedding";
import { expenseSchema } from "@/lib/schemas/budget";

describe("taskSchema", () => {
  it("accepts valid task", () => {
    const result = taskSchema.safeParse({ title: "Book venue", priority: "high", status: "not_started" });
    expect(result.success).toBe(true);
  });

  it("rejects missing title", () => {
    const result = taskSchema.safeParse({ priority: "medium" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid status", () => {
    const result = taskSchema.safeParse({ title: "Task", status: "done" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid priority", () => {
    const result = taskSchema.safeParse({ title: "Task", priority: "urgent" });
    expect(result.success).toBe(false);
  });
});

describe("vendorSchema", () => {
  it("accepts valid vendor", () => {
    const result = vendorSchema.safeParse({ name: "Bloom Florals", category: "flowers", status: "booked" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = vendorSchema.safeParse({ name: "Test", category: "other", email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("accepts empty string email", () => {
    const result = vendorSchema.safeParse({ name: "Test", category: "other", email: "" });
    expect(result.success).toBe(true);
  });
});

describe("guestSchema", () => {
  it("accepts valid guest", () => {
    const result = guestSchema.safeParse({
      first_name: "Alice", last_name: "Smith",
      rsvp_status: "attending", invitation_status: "sent", plus_one_allowed: false,
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing last_name", () => {
    const result = guestSchema.safeParse({ first_name: "Alice" });
    expect(result.success).toBe(false);
  });
});

describe("weddingSchema", () => {
  it("accepts valid wedding", () => {
    const result = weddingSchema.safeParse({
      name: "Avery & Jordan",
      partner_one_name: "Avery",
      partner_two_name: "Jordan",
      total_budget: 25000,
      currency: "USD",
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative budget", () => {
    const result = weddingSchema.safeParse({
      name: "Test", partner_one_name: "A", partner_two_name: "B", total_budget: -100,
    });
    expect(result.success).toBe(false);
  });
});

describe("expenseSchema", () => {
  it("accepts valid expense", () => {
    const result = expenseSchema.safeParse({
      title: "Venue deposit", planned_amount: 3000, actual_amount: 3000, payment_status: "paid",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid payment_status", () => {
    const result = expenseSchema.safeParse({ title: "Test", payment_status: "free" });
    expect(result.success).toBe(false);
  });
});
