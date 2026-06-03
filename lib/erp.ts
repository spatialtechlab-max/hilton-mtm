/**
 * Hilton ERP — server-only fetcher. The API keys live in env vars and must
 * never reach the client. Items are fetched with ISR (revalidate) so the
 * storefront stays fast and roughly live (5 min freshness).
 */

import type { LibraryItem, LibrarySection } from "./libraries";

export type ErpItem = {
  id: number;
  name: string;
  code: string;
  barcode: string;
  description: string;
  design: string;
  shade: string;
  color: string;
  origin: string;
  size: string;
  weight: string;
  categoryID: number;
  categoryName: string;
  brandID: number;
  brandName: string;
  sellingPrice: number;
  status: string; // "A" = active
  thumbnail: string;
  images: string[];
};

type ErpResponse = { statusCode: number; data: { total: number; items: ErpItem[] } };

const REVALIDATE_SECS = 300;

export async function fetchErpItems(): Promise<ErpItem[]> {
  const base = process.env.ERP_BASE_URL;
  const key = process.env.ERP_API_KEY;
  const secret = process.env.ERP_SECRET_KEY;
  if (!base || !key || !secret) return [];

  try {
    const res = await fetch(`${base}/api/item_list.php`, {
      method: "POST",
      headers: {
        "X-API-KEY": key,
        "X-SECRET-KEY": secret,
        "Content-Type": "application/json",
      },
      body: "{}",
      next: { revalidate: REVALIDATE_SECS },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as ErpResponse;
    if (json.statusCode !== 200) return [];
    return (json.data?.items ?? []).filter((i) => i.status === "A");
  } catch {
    return [];
  }
}

/* ──────────────────────── Mapping ──────────────────────── */

const titleCase = (s: string) =>
  s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()).replace(/\s+/g, " ").trim();

/**
 * The ERP stores HTML-escaped strings ("B&amp;S LINEN" rather than
 * "B&S LINEN"). Decode the handful of entities that actually appear so
 * the storefront reads cleanly.
 */
const decodeEntities = (s: string) =>
  s
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");

/**
 * Strip the various category prefixes the ERP bakes into the name field
 * ("BELTMAGNANNI1128 GREY" → "Magnanni1128 Grey"; "SILK TIEMARTIN 504 2"
 * → "Martin 504 2"; "FABRICB&S LINEN BL0258-3" → "B&S Linen Bl0258-3"),
 * then decode any HTML entities and title-case it.
 */
function prettyName(name: string, categoryName: string): string {
  const prefixes = [
    categoryName, "FABRIC", "SILK TIE", "SUITS", "SUITING", "SUITINGS",
    "JACKETING", "JACKET", "SHIRTING", "SHIIRTING", "SHIRTS",
    "PANTS", "BELT", "TIE", "BLAZER",
  ];
  let stripped = name;
  for (const p of prefixes) {
    const re = new RegExp(`^${p}\\s*`, "i");
    if (re.test(stripped)) { stripped = stripped.replace(re, ""); break; }
  }
  return titleCase(decodeEntities(stripped));
}

const FALLBACK_SRC = "/products/no-image.svg";

/**
 * The ERP returns "/catalogue/placeholder.svg" (or other relative paths)
 * for items that don't yet have real photography. next/image would treat
 * those as local /public assets and 404. Substitute a tasteful local
 * placeholder instead, so the tile reads as "photo coming" not "broken".
 */
function cleanSrc(src: string | undefined): string {
  if (!src) return FALLBACK_SRC;
  if (src.includes("placeholder")) return FALLBACK_SRC;
  // Only http(s) — the ERP sometimes returns relative paths that don't
  // resolve from our public folder.
  if (!/^https?:\/\//i.test(src)) return FALLBACK_SRC;
  return src;
}

/** Normalise an ERP free-text value: decode entities, title-case,
 *  trim, and treat blanks as undefined. */
function clean(v: string | number | undefined | null): string | undefined {
  if (v === undefined || v === null) return undefined;
  const s = String(v).trim();
  return s ? titleCase(decodeEntities(s)) : undefined;
}

function mapItem(item: ErpItem): LibraryItem {
  const composition = clean(item.description); // "100% Silk", "70% Wool & 30% Polyester"
  const brand       = clean(item.brandName);
  const pattern     = clean(item.design);
  const color       = clean(item.color);
  const shade       = clean(item.shade);
  const origin      = clean(item.origin);
  const weight      = clean(item.weight);     // "240 Grams", "270 Grams"
  const size        = clean(item.size);
  const code        = clean(item.code);

  // The "cloth" line shown under the product name — composition is the most
  // useful summary (everyone wants to know "is this 100% silk?").
  const cloth = composition ?? ([brand, pattern].filter(Boolean).join(" · ") || undefined);

  // Short editorial detail string used as the alt + description summary.
  const detail = [brand, pattern, origin].filter(Boolean).join(" · ");

  const thumb = cleanSrc(item.thumbnail);
  const cleanGallery = (item.images ?? []).map(cleanSrc).filter((g) => g !== FALLBACK_SRC);

  // The ERP convention (confirmed with the atelier's upload tool: IMAGE *
  // is the swatch, IMAGE 1 is the on-form garment hero, IMAGE 2 / 3 are
  // back / detail) bakes the upload slot into the filename — `pic` for
  // the swatch, `pic1` / `pic2` / `pic3` for the gallery. The ERP's
  // `images` array, however, is in upload-order and varies per item
  // (we've seen [pic3, pic1, pic2] for shirt 2832), so picking
  // gallery[0] blindly can land on a swatch. Sorting by the numeric
  // suffix in the filename gives us pic1 → pic2 → pic3 consistently,
  // which means the library tile always shows the garment hero.
  const sortedGallery = [...cleanGallery].sort((a, b) => {
    const n = (s: string) => {
      const m = s.match(/_pic(\d+)_/);
      return m ? Number(m[1]) : 999;
    };
    return n(a) - n(b);
  });

  // The library tiles want the dressed garment as the hero image — they
  // read as "a shirt" / "a jacket" / "a tie", not as "a cloth" — so we
  // prefer the first sorted gallery photo (pic1) when present. The
  // customizer fabric picker still wants the swatch and uses
  // /api/fabrics which keeps `thumbnail` as `image`.
  const hero = sortedGallery[0] ?? thumb;

  return {
    sku: String(item.id),
    name: prettyName(item.name, item.categoryName),
    type: titleCase(item.categoryName),
    cloth,
    price: `د.ب ${item.sellingPrice}`,
    alt: [brand, pattern, color].filter(Boolean).join(" ").trim(),
    description: detail,
    media: { kind: "photo", src: hero },
    // Gallery on the PDP shows sorted garment photos first, then the
    // swatch, so the carousel opens on the dressed garment but the
    // cloth itself is still browseable.
    gallery: (() => {
      const all = [...sortedGallery, thumb].filter((s, i, a) => s && a.indexOf(s) === i);
      return all.length > 0 ? all : undefined;
    })(),
    // Richer spec fields surfaced on the PDP details table.
    brand,
    code,
    composition,
    pattern,
    color,
    shade,
    weight,
    size,
    origin,
  };
}

/** Does this ERP item have at least one on-form garment photo
 *  (pic1 / pic2 / pic3) in its gallery? If only the cropped swatch
 *  exists we hide the item from the library tiles — a customer
 *  browsing /library/shirts wants to see shirts, not cloth. The
 *  item still surfaces in the customizer fabric picker where the
 *  swatch IS the right context. */
function hasGarmentShot(item: ErpItem): boolean {
  const gallery = item.images ?? [];
  return gallery.some((src) => /_pic\d+_/.test(src));
}

/** Build LibrarySection[] for one ERP-backed slug from ERP. */
export function sectionsFromErp(slug: ErpBackedSlug, items: ErpItem[]): LibrarySection[] {
  const wanted = ERP_CATEGORIES_FOR_SLUG[slug];
  const filtered = items
    .filter((i) => wanted.includes(i.categoryName.toUpperCase()))
    .filter(hasGarmentShot);
  if (filtered.length === 0) return [];

  // Group by brand for a clean sub-section header. Decode entities first
  // so "B&amp;S LINEN" lands as "B&S Linen" — both the displayed title
  // ("B&S Linen") and the count line ("6 pieces from B&S Linen.") read
  // cleanly.
  const groups = new Map<string, ErpItem[]>();
  for (const i of filtered) {
    const b = titleCase(decodeEntities(i.brandName || "House"));
    groups.set(b, [...(groups.get(b) ?? []), i]);
  }
  return [...groups.entries()].map(([brand, list], idx) => ({
    slug: brand.toLowerCase().replace(/\s+/g, "-") || `section-${idx}`,
    title: brand,
    note: `${list.length} ${list.length === 1 ? "piece" : "pieces"} from ${brand}.`,
    items: list.map(mapItem),
  }));
}

// Each library slug maps to the set of ERP categoryName values (matched
// case-insensitively, includes the spreadsheet variants/typos) that
// should populate it. SHIRTING / PANTS / SHOES went live as ERP categories
// after the initial build, so they need to be wired here for the
// existing /library/[slug] page to surface real ERP items instead of
// the static placeholders.
// Mapped from `Active_categories_hilton_material.xlsx` (the atelier's
// authoritative list). Each library slug pulls every ERP categoryName
// variant the atelier uses — including known typos (SHIIRTING, SUIES,
// SUIUS) — so a misspelled category in the ERP never makes a cloth or
// accessory go invisible on the storefront.
export const ERP_CATEGORIES_FOR_SLUG: Record<
  "ties" | "belts" | "cloths" | "shirts" | "trousers" | "shoes" | "tailoring",
  string[]
> = {
  ties:      ["TIE", "TIES", "BOW TIE", "RTW BOWTIE"],
  belts:     ["BELT", "ZAMPIERE BELT"],
  cloths:    ["SUITING", "SUITINGS", "SUITS", "SUIES", "SUIUS", "JACKETING", "BLAZER"],
  shirts:    ["SHIRTING", "SHIIRTING", "SHIRTS"],
  trousers:  ["PANTS", "CHINO PANTS"],
  shoes:     ["SHOES"],
  tailoring: ["SUITING", "SUITINGS", "SUITS", "JACKETING", "JACKET", "BLAZER", "OVERCOAT"],
};

export const ERP_BACKED_SLUGS = [
  "ties", "belts", "cloths", "shirts", "trousers", "shoes", "tailoring",
] as const;
export type ErpBackedSlug = (typeof ERP_BACKED_SLUGS)[number];
export const isErpBacked = (slug: string): slug is ErpBackedSlug =>
  (ERP_BACKED_SLUGS as readonly string[]).includes(slug);
