/**
 * Which body measurements an order needs, given what's in the cart.
 *
 * Pure (no Supabase, no React) so BOTH the client checkout gate and the
 * server payment route can import it. A commission is cut to the customer's
 * measurements, so an order containing one can't be placed until the relevant
 * measurements are on file. Accessories (cart lines with no `custom`) need
 * none, so an accessory-only order is never blocked. We only require the body
 * areas the order actually involves: trousers need lower-body, jackets/shirts
 * need upper-body, a suit needs both.
 */
import { measurementGroups, type MeasurementGroup, type MeasurementValues } from "./customizer";

const UPPER = measurementGroups.find((g) => g.slug === "upper")!;
const LOWER = measurementGroups.find((g) => g.slug === "lower")!;

/** Body areas a single commission category involves. */
function areasFor(category: string): { upper: boolean; lower: boolean } {
  const c = (category || "").toLowerCase();
  if (/trouser|pant|chino|short/.test(c)) return { upper: false, lower: true };
  if (c === "suit") return { upper: true, lower: true };
  // jacket, shirt, overcoat, blazer, tuxedo, and any other commissioned
  // garment are upper-body cuts.
  return { upper: true, lower: false };
}

/** The measurement groups a cart of these commission categories requires. */
export function requiredMeasurementGroups(categories: string[]): MeasurementGroup[] {
  let upper = false, lower = false;
  for (const cat of categories) {
    const a = areasFor(cat);
    upper = upper || a.upper;
    lower = lower || a.lower;
  }
  const out: MeasurementGroup[] = [];
  if (upper) out.push(UPPER);
  if (lower) out.push(LOWER);
  return out;
}

/** Every measurement slug that must be filled for these categories. */
export function requiredMeasurementSlugs(categories: string[]): string[] {
  return requiredMeasurementGroups(categories).flatMap((g) => g.items.map((i) => i.slug));
}

/** Required-but-blank measurement slugs. Empty array means complete. */
export function missingMeasurements(
  values: MeasurementValues | null | undefined,
  categories: string[],
): string[] {
  const v = values ?? {};
  return requiredMeasurementSlugs(categories).filter(
    (slug) => !((v[slug] ?? "").toString().trim()),
  );
}
