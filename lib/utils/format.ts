import { format, parseISO } from "date-fns";

export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string | null | undefined, pattern = "MMM d, yyyy"): string {
  if (!dateStr) return "—";
  try {
    return format(parseISO(dateStr), pattern);
  } catch {
    return "—";
  }
}

export function formatShortDate(dateStr: string | null | undefined): string {
  return formatDate(dateStr, "MMM d");
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, " ");
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
