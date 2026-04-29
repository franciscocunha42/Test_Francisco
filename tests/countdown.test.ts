import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCountdown } from "@/lib/utils/countdown";
import { addDays, subDays, format } from "date-fns";

describe("getCountdown", () => {
  it("returns label when date is null", () => {
    const result = getCountdown(null);
    expect(result.label).toBe("Date not set");
    expect(result.days).toBe(0);
    expect(result.isPast).toBe(false);
  });

  it("returns correct days for future date", () => {
    const future = addDays(new Date(), 30);
    const dateStr = format(future, "yyyy-MM-dd");
    const result = getCountdown(dateStr);
    expect(result.isPast).toBe(false);
    expect(result.days).toBeGreaterThanOrEqual(29);
    expect(result.days).toBeLessThanOrEqual(31);
    expect(result.label).toContain("days to go");
  });

  it("returns isPast for past date", () => {
    const past = subDays(new Date(), 10);
    const dateStr = format(past, "yyyy-MM-dd");
    const result = getCountdown(dateStr);
    expect(result.isPast).toBe(true);
    expect(result.days).toBeGreaterThanOrEqual(9);
    expect(result.days).toBeLessThanOrEqual(11);
    expect(result.label).toContain("days ago");
  });

  it("returns 'Today!' for today's date", () => {
    const today = format(new Date(), "yyyy-MM-dd");
    const result = getCountdown(today);
    expect(result.days).toBe(0);
    expect(result.label).toBe("Today!");
  });
});
