/**
 * Builds a compact, prompt-ready summary of the live ERP fabric inventory
 * for the four active garment categories. The concierge route injects this
 * into the system prompt so Sebastian can only recommend cloth the atelier
 * actually holds — and can stamp the recommendation with a real SKU that
 * deep-links the customer straight into the spec step of /customize.
 *
 * Calls the project's own /api/fabrics endpoint (which already handles ERP
 * + the mtm_garments gate + admin disables + the house shirting library)
 * so this stays the single source of truth.
 */

const CATEGORIES = ["suit", "jacket", "shirt", "trouser"] as const;
type Category = typeof CATEGORIES[number];

// Cap per category so the prompt budget stays sensible. The model only
// needs a representative spread to choose from — not every SKU in the
// archive. Items are taken in the order the ERP returns them, which the
// atelier curates by recency.
const MAX_PER_CATEGORY = 12;

type Fabric = {
  sku: string;
  name?: string;
  brand?: string;
  composition?: string;
  pattern?: string;
  color?: string;
  weight?: string;
  origin?: string;
  price?: string;
};

/** One-line summary of a single fabric — terse, model-friendly. */
function lineForFabric(f: Fabric): string {
  const parts: string[] = [];
  parts.push(`SKU ${f.sku}`);
  if (f.brand && f.brand !== "Missing value") parts.push(f.brand);
  const trail: string[] = [];
  if (f.name && f.name !== "Missing value") trail.push(f.name);
  if (f.composition && f.composition !== "Missing value") trail.push(f.composition);
  if (f.weight && f.weight !== "Missing value") trail.push(f.weight);
  if (f.color && f.color !== "Missing value") trail.push(f.color);
  if (f.pattern && f.pattern !== "Missing value" && f.pattern.toLowerCase() !== "solid") trail.push(f.pattern);
  const tail = trail.join(", ");
  const main = parts.join(" — ");
  return tail ? `${main} — ${tail}` : main;
}

async function fetchOne(baseUrl: string, category: Category): Promise<Fabric[]> {
  try {
    const res = await fetch(`${baseUrl}/api/fabrics?category=${category}`, {
      // The underlying ERP fetch already ISR-caches; re-using the cache here
      // would over-couple the chat to its 5-minute window. Default cache is
      // fine — Vercel reuses the same compute region so this is near-local.
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    const arr = Array.isArray(data?.fabrics) ? data.fabrics : [];
    return arr.slice(0, MAX_PER_CATEGORY);
  } catch {
    return [];
  }
}

/**
 * Returns a single text block ready to slot into the system prompt.
 * Layout is intentionally rigid (uppercase category headers, dashes, no
 * markdown) so the model latches onto it as data rather than prose.
 *
 * Empty categories print a "(no stock — recommend ATELIER-<CAT> placeholder)"
 * line so the model doesn't hallucinate a SKU when there's nothing to pick.
 */
export async function getInventorySummaryForPrompt(baseUrl: string): Promise<string> {
  const results = await Promise.all(CATEGORIES.map((c) => fetchOne(baseUrl, c)));

  const sections: string[] = [];
  CATEGORIES.forEach((cat, i) => {
    const fabrics = results[i];
    const header = `${cat.toUpperCase()} CLOTH (${fabrics.length} in stock):`;
    if (fabrics.length === 0) {
      sections.push(`${header}\n  - (no stock — use "ATELIER-${cat.toUpperCase()}" as fabric_sku)`);
      return;
    }
    const lines = fabrics.map((f) => `  - ${lineForFabric(f)}`).join("\n");
    sections.push(`${header}\n${lines}`);
  });
  return sections.join("\n\n");
}
