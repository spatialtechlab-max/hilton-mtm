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

// Every garment draws from the same cloth pool for now (SUITING + JACKETING
// — the only fabric categories the ERP currently exposes). When the ERP
// adds dedicated SHIRTING / TROUSERING categories, scope per garment below.
const ALL_CLOTHS = ["SUITING", "JACKETING", "SHIRTING", "TROUSERING"];
const ERP_CATEGORIES_FOR_GARMENT: Record<string, string[]> = {
  suit:    ALL_CLOTHS,
  jacket:  ALL_CLOTHS,
  shirt:   ALL_CLOTHS,
  trouser: ALL_CLOTHS,
};

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
    // What the ERP itself classifies this cloth as — SUITING / JACKETING /
    // SHIRTING / TROUSERING. Surfacing this lets the customizer scope the
    // fabric picker per garment instead of pooling everything together.
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

  return NextResponse.json({ fabrics, category });
}
