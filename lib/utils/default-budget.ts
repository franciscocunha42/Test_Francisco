// Default budget category proportions. Ratios are derived from the
// industry-typical wedding budget breakdown and sum to 1.0. When a wedding
// is created, each category's planned amount is computed from the user's
// total budget so the seven categories always sum to total_budget.
//
// Values come from the previous fixed defaults (which summed to $30,000):
//   Venue & Rentals      35.00%
//   Catering & Cake      28.33%
//   Photography & Video  11.67%
//   Flowers & Decor       8.33%
//   Music & Entertainment 5.00%
//   Beauty & Attire       6.67%
//   Honeymoon             5.00%

export interface DefaultCategoryRatio {
  name: string;
  ratio: number;
}

export const DEFAULT_BUDGET_CATEGORY_RATIOS: DefaultCategoryRatio[] = [
  { name: "Venue & Rentals",       ratio: 10500 / 30000 },
  { name: "Catering & Cake",       ratio:  8500 / 30000 },
  { name: "Photography & Video",   ratio:  3500 / 30000 },
  { name: "Flowers & Decor",       ratio:  2500 / 30000 },
  { name: "Music & Entertainment", ratio:  1500 / 30000 },
  { name: "Beauty & Attire",       ratio:  2000 / 30000 },
  { name: "Honeymoon",             ratio:  1500 / 30000 },
];

/** Distribute `totalBudget` across the default categories so the planned
 *  amounts sum exactly to `totalBudget`. The last category absorbs any
 *  rounding remainder.  */
export function scaleDefaultCategories(totalBudget: number): { name: string; planned_amount: number }[] {
  const total = Math.max(0, Math.round(totalBudget));
  if (total === 0) {
    return DEFAULT_BUDGET_CATEGORY_RATIOS.map((c) => ({ name: c.name, planned_amount: 0 }));
  }
  const scaled = DEFAULT_BUDGET_CATEGORY_RATIOS.map((c) => ({
    name: c.name,
    planned_amount: Math.round(total * c.ratio),
  }));
  const sum = scaled.reduce((s, c) => s + c.planned_amount, 0);
  const diff = total - sum;
  if (diff !== 0 && scaled.length > 0) {
    scaled[scaled.length - 1].planned_amount += diff;
  }
  return scaled;
}
