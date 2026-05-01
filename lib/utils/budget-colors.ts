import type { BudgetCategory } from "@/lib/types/database";

// RGB tuples for distinct, wedding-friendly category colors.
export const CATEGORY_PALETTE: [number, number, number][] = [
  [216,  90,  90],  // rose
  [ 90, 148, 210],  // sky blue
  [100, 180, 110],  // sage green
  [220, 165,  55],  // amber / gold
  [155, 100, 200],  // lavender
  [ 55, 178, 190],  // teal
  [210, 120,  70],  // orange
  [200,  90, 145],  // pink
];

/**
 * Assigns a stable color to each category keyed by its id.
 * Order is based on the array position, so callers should pass the
 * original (unsorted) category list to keep colors stable across sort changes.
 */
export function buildColorMap(
  categories: BudgetCategory[],
): Map<string, [number, number, number]> {
  const map = new Map<string, [number, number, number]>();
  categories.forEach((cat, i) => {
    map.set(cat.id, CATEGORY_PALETTE[i % CATEGORY_PALETTE.length]);
  });
  return map;
}

export function toRgba(rgb: [number, number, number], alpha: number): string {
  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`;
}
