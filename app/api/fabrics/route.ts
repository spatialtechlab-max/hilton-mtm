/**
 * Lightweight server endpoint that returns the live ERP fabrics, sliced for
 * a given garment category. The customize page calls this on mount to
 * populate its fabric-picker phase — keeps the ERP keys server-side and
 * inherits the same 5-min ISR cache used by the library pages.
 *
 * Usage:  GET /api/fabrics?category=suit | jacket | shirt | trouser
 *
 * Today the ERP only feeds back SUITING + JACKETING — so suit/jacket get
 * the cloths library, and shirt/trouser get an empty list (until ERP
 * starts returning SHIRT / TROUSER categories).
 */
import { NextResponse } from "next/server";
import { fetchErpItems, type ErpItem } from "@/lib/erp";
import { createClient } from "@supabase/supabase-js";

/** Pulls the set of fabric SKUs the admin has explicitly disabled. */
async function fetchDisabledSkus(): Promise<Set<string>> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return new Set();
  try {
    const sb = createClient(url, key);
    const { data, error } = await sb
      .from("mtm_fabric_overrides")
      .select("sku, active")
      .eq("active", false);
    if (error || !data) return new Set();
    return new Set(data.map((r) => String(r.sku)));
  } catch {
    return new Set();
  }
}

const titleCase = (s: string) =>
  s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()).replace(/\s+/g, " ").trim();

const FALLBACK_SRC = "/products/no-image.svg";
const cleanSrc = (src: string | undefined) => {
  if (!src) return FALLBACK_SRC;
  if (src.includes("placeholder")) return FALLBACK_SRC;
  if (!/^https?:\/\//i.test(src)) return FALLBACK_SRC;
  return src;
};

// Each ERP cloth carries a `categoryName` that the mill set when adding
// it to the Hilton ERP. We honour that classification so the customer
// only sees cloths actually appropriate for their commission:
//
//   SUITING    — used for matching two-piece suits AND can be cut as a
//                separate trouser; suit + trouser see it.
//   JACKETING  — heavier / textured cloth meant for standalone jackets
//                and sport coats; only jacket sees it.
//   SHIRTING   — shirt-weight cottons; shirt sees it.
//   TROUSERING — dedicated trouser cloths; trouser sees it.
//
// A jacket commission can also be cut from suiting cloth (very common
// in tailoring), so jacket inherits SUITING in addition to JACKETING.
const ERP_CATEGORIES_FOR_GARMENT: Record<string, string[]> = {
  suit:    ["SUITING"],
  jacket:  ["SUITING", "JACKETING"],
  shirt:   ["SHIRTING"],
  trouser: ["SUITING", "TROUSERING"],
};

// Friendly placeholder for garments the ERP hasn't yet stocked cloth
// for (today: SHIRTING + TROUSERING are missing). Keeps the customizer
// flow intact — the customer picks "Sourced at the atelier" and can
// finalise the cloth at their fitting with Sebastian.
const PLACEHOLDER_FABRIC = (category: string) => ({
  sku: `ATELIER-${category.toUpperCase()}`,
  name: "Sourced at the atelier",
  brand: "Hilton MTM",
  composition: "Choose your cloth at the fitting",
  pattern: "",
  color: "",
  weight: "",
  origin: "Manama, Bahrain",
  price: "د.ب 0",
  priceNum: 0,
  image: "/products/no-image.svg",
  erpCategory: "PLACEHOLDER",
});

function stripPrefix(name: string, categoryName: string): string {
  const prefixes = [categoryName, "SUITS", "JACKET"];
  for (const p of prefixes) {
    const re = new RegExp(`^${p}\\s*`, "i");
    if (re.test(name)) return name.replace(re, "");
  }
  return name;
}

function toFabric(item: ErpItem) {
  return {
    sku: String(item.id),
    name: titleCase(stripPrefix(item.name, item.categoryName)),
    brand: titleCase(item.brandName || ""),
    composition: item.description ? titleCase(item.description) : "",
    pattern: titleCase(item.design || ""),
    color: titleCase(item.color || ""),
    weight: item.weight || "",
    origin: titleCase(item.origin || ""),
    price: `د.ب ${item.sellingPrice}`,
    priceNum: item.sellingPrice,
    image: cleanSrc(item.thumbnail),
    erpCategory: (item.categoryName || "").toUpperCase(),
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = (searchParams.get("category") || "suit").toLowerCase();
  const includeDisabled = searchParams.get("includeDisabled") === "1";
  const wanted = ERP_CATEGORIES_FOR_GARMENT[category] ?? [];

  const [items, disabled] = await Promise.all([fetchErpItems(), fetchDisabledSkus()]);

  const fabrics = items
    .filter((i) => wanted.includes(i.categoryName.toUpperCase()))
    .filter((i) => includeDisabled || !disabled.has(String(i.id)))
    .map(toFabric);

  // If the ERP hasn't stocked cloth in the right category yet — currently
  // SHIRTING and TROUSERING are both empty — drop in a single placeholder
  // so the customizer flow doesn't dead-end. The /admin tools (and any
  // future ERP entries) will replace this transparently.
  if (fabrics.length === 0 && !includeDisabled) {
    return NextResponse.json({
      fabrics: [PLACEHOLDER_FABRIC(category)],
      category,
      placeholder: true,
    });
  }

  return NextResponse.json({ fabrics, category });
}
