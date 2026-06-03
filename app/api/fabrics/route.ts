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

// The ERP encodes "&" as "&amp;" in name/brand fields (it stores HTML-
// escaped strings). Decode the handful of entities that actually appear
// so the storefront reads "B&S Linen" instead of "B&amp;S Linen".
const decodeEntities = (s: string) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

const FALLBACK_SRC = "/products/no-image.svg";
const cleanSrc = (src: string | undefined) => {
  if (!src) return FALLBACK_SRC;
  if (src.includes("placeholder")) return FALLBACK_SRC;
  if (!/^https?:\/\//i.test(src)) return FALLBACK_SRC;
  return src;
};
const cleanGallery = (arr: string[] | undefined) =>
  (arr ?? []).map(cleanSrc).filter((g) => g !== FALLBACK_SRC);

// Each ERP cloth carries a `categoryName` set by the atelier when
// adding the item. The Hilton ERP has been seeded with a long tail of
// active categories (see Active_categories spreadsheet) including
// variants/typos like SUITINGS / SUITS / SHIIRTING. We collapse all of
// those into the four customizer garments so the storefront stays
// resilient to ERP naming choices.
//
//   suit    ← SUITING family (incl. typos) + BLAZER
//   jacket  ← JACKETING + JACKET + BLAZER + RTWJKT,
//             plus SUITING (a jacket can be cut from suiting)
//   shirt   ← SHIRTING family (incl. typos) + SHIRTS
//   trouser ← PANTS + CHINO PANTS, plus SUITING (matching suit cloth
//             can be cut as a separate trouser)
// Strict per-garment mapping — each garment only pulls cloths the
// atelier has explicitly tagged for it. Per client direction: never
// substitute suit cloth onto the trouser flow (or jacketing onto suit,
// etc.) just because that garment's category is empty in the ERP. If
// there are no real items for a garment, the picker falls through to
// the PLACEHOLDER_FABRIC empty state below.
const ERP_CATEGORIES_FOR_GARMENT: Record<string, string[]> = {
  suit:    ["SUITING", "SUITINGS", "SUITS", "SUIES", "SUIUS"],
  jacket:  ["JACKETING", "JACKET", "BLAZER", "RTWJKT"],
  shirt:   ["SHIRTING", "SHIIRTING", "SHIRTS"],
  trouser: ["PANTS", "CHINO PANTS"],
};

// Friendly placeholder for garments the ERP hasn't yet stocked cloth
// for. Keeps the customizer flow intact — the customer picks "Sourced
// at the atelier" and can finalise the cloth at their fitting with
// Sebastian.
const PLACEHOLDER_FABRIC = (category: string) => ({
  sku: `ATELIER-${category.toUpperCase()}`,
  name: "Sourced at the atelier",
  brand: "Hilton MTM",
  composition: "Choose your cloth at the fitting",
  pattern: "",
  color: "",
  weight: "",
  origin: "Manama, Bahrain",
  price: "BHD 0",
  priceNum: 0,
  image: "/products/no-image.svg",
  erpCategory: "PLACEHOLDER",
});

// House shirting library — real mills the atelier sources from for
// bespoke shirts. We carry this in code until the ERP starts returning
// SHIRTING items; the API serves these only when the ERP has nothing
// in SHIRTING, so the customer always sees real cloth on the picker.
// Pricing is the standard Hilton bespoke-shirt cloth rate; the atelier
// can adjust per fitting.
const SHIRT_HOUSE_LIBRARY = [
  {
    sku: "HOUSE-ALUMO-OXFORD-WHITE",
    name: "Alumo Oxford — Optic White",
    brand: "Alumo",
    composition: "100% Two-Ply Egyptian Cotton",
    pattern: "Solid",
    color: "Optic White",
    weight: "120 Grams",
    origin: "Switzerland",
    price: "BHD 95",
    priceNum: 95,
    image: "/atelier/alumo-shirting.jpg",
    erpCategory: "SHIRTING",
  },
  {
    sku: "HOUSE-ALUMO-POPLIN-SKY",
    name: "Alumo Poplin — Sky Blue",
    brand: "Alumo",
    composition: "100% Two-Ply Egyptian Cotton",
    pattern: "Solid",
    color: "Sky Blue",
    weight: "110 Grams",
    origin: "Switzerland",
    price: "BHD 95",
    priceNum: 95,
    image: "/atelier/alumo-shirting.jpg",
    erpCategory: "SHIRTING",
  },
  {
    sku: "HOUSE-THOMAS-MASON-JOURNEY-WHITE",
    name: "Thomas Mason Journey — White Twill",
    brand: "Thomas Mason",
    composition: "100% Cotton, Two-Ply Twill",
    pattern: "Solid",
    color: "White",
    weight: "130 Grams",
    origin: "Italy",
    price: "BHD 85",
    priceNum: 85,
    image: "/atelier/alumo-shirting.jpg",
    erpCategory: "SHIRTING",
  },
  {
    sku: "HOUSE-THOMAS-MASON-BENGAL-STRIPE",
    name: "Thomas Mason — Bengal Stripe Blue",
    brand: "Thomas Mason",
    composition: "100% Cotton Broadcloth",
    pattern: "Bengal Stripe",
    color: "White & French Blue",
    weight: "115 Grams",
    origin: "Italy",
    price: "BHD 85",
    priceNum: 85,
    image: "/atelier/alumo-shirting.jpg",
    erpCategory: "SHIRTING",
  },
  {
    sku: "HOUSE-ALBINI-PINPOINT-BLUE",
    name: "Albini Pinpoint — Powder Blue",
    brand: "Albini",
    composition: "100% Cotton Pinpoint",
    pattern: "Solid",
    color: "Powder Blue",
    weight: "120 Grams",
    origin: "Italy",
    price: "BHD 80",
    priceNum: 80,
    image: "/atelier/alumo-shirting.jpg",
    erpCategory: "SHIRTING",
  },
  {
    sku: "HOUSE-ALBINI-GINGHAM-NAVY",
    name: "Albini — Navy Gingham Check",
    brand: "Albini",
    composition: "100% Cotton Broadcloth",
    pattern: "Gingham",
    color: "Navy & White",
    weight: "115 Grams",
    origin: "Italy",
    price: "BHD 80",
    priceNum: 80,
    image: "/atelier/alumo-shirting.jpg",
    erpCategory: "SHIRTING",
  },
  {
    sku: "HOUSE-CANCLINI-HERRINGBONE-WHITE",
    name: "Canclini Herringbone — White",
    brand: "Canclini",
    composition: "100% Cotton Herringbone",
    pattern: "Herringbone",
    color: "White",
    weight: "135 Grams",
    origin: "Italy",
    price: "BHD 75",
    priceNum: 75,
    image: "/atelier/alumo-shirting.jpg",
    erpCategory: "SHIRTING",
  },
  {
    sku: "HOUSE-MONTI-ROYAL-OXFORD-BLUE",
    name: "Monti Royal Oxford — Mid Blue",
    brand: "Monti",
    composition: "100% Cotton Royal Oxford",
    pattern: "Solid",
    color: "Mid Blue",
    weight: "130 Grams",
    origin: "Czechia",
    price: "BHD 70",
    priceNum: 70,
    image: "/atelier/alumo-shirting.jpg",
    erpCategory: "SHIRTING",
  },
];

function stripPrefix(name: string, categoryName: string): string {
  // The ERP often prefixes the item name with its category (or a
  // related noun) — e.g. "FABRICRAYMOND 04", "SUITSWM19027 58104",
  // "JACKETDELFINO 2601", "SILK TIEMARTIN 504 2". Strip each known
  // prefix so the display name reads cleanly.
  const prefixes = [
    categoryName, "FABRIC", "SUITS", "SUITING", "SUITINGS",
    "JACKETING", "JACKET", "SHIRTING", "SHIRTS", "PANTS",
    "BELT", "SILK TIE", "TIE", "BLAZER",
  ];
  for (const p of prefixes) {
    const re = new RegExp(`^${p}\\s*`, "i");
    if (re.test(name)) return name.replace(re, "");
  }
  return name;
}

function toFabric(item: ErpItem) {
  const thumb = cleanSrc(item.thumbnail);
  const gallery = cleanGallery(item.images);
  return {
    sku: String(item.id),
    code: item.code ? decodeEntities(item.code) : "",
    name: titleCase(decodeEntities(stripPrefix(item.name, item.categoryName))),
    brand: titleCase(decodeEntities(item.brandName || "")),
    composition: item.description ? titleCase(decodeEntities(item.description)) : "",
    pattern: titleCase(decodeEntities(item.design || "")),
    color: titleCase(decodeEntities(item.color || "")),
    shade: item.shade ? decodeEntities(item.shade) : "",
    weight: item.weight ? item.weight.replace(/\s+/g, " ").trim() : "",
    size: item.size ? decodeEntities(item.size) : "",
    origin: titleCase(decodeEntities(item.origin || "")),
    price: `BHD ${item.sellingPrice}`,
    priceNum: item.sellingPrice,
    // `image` is the primary swatch the picker tile shows; `gallery`
    // is the additional photos the atelier uploaded (usually a
    // garment-on-form shot + close-up weave). The customizer will
    // surface them in a modal when the customer wants more detail.
    image: thumb,
    gallery: gallery.length ? gallery : undefined,
    erpCategory: (item.categoryName || "").toUpperCase(),
    erpCategoryID: item.categoryID,
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

  // SHIRTING is empty in the ERP today, so we serve the in-code house
  // library (real mills the atelier sources from). Once SHIRTING items
  // land in the ERP, they take precedence and the library steps out of
  // the way automatically. Admin can hide any house sku with the same
  // `mtm_fabric_overrides` row (active=false) used for ERP cloths.
  if (category === "shirt" && fabrics.length === 0 && !includeDisabled) {
    const lib = SHIRT_HOUSE_LIBRARY.filter((f) => !disabled.has(f.sku));
    if (lib.length > 0) {
      return NextResponse.json({ fabrics: lib, category, source: "house" });
    }
  }

  // For any other garment where the ERP hasn't stocked cloth, fall back
  // to a single "Sourced at the atelier" card so the flow doesn't dead-end.
  if (fabrics.length === 0 && !includeDisabled) {
    return NextResponse.json({
      fabrics: [PLACEHOLDER_FABRIC(category)],
      category,
      placeholder: true,
    });
  }

  return NextResponse.json({ fabrics, category });
}
