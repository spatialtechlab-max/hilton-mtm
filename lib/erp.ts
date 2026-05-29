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
 * Strip the various category prefixes the ERP bakes into the name field
 * ("BELTMAGNANNI1128 GREY" → "Magnanni1128 Grey"; "SILK TIEMARTIN 504 2"
 * → "Martin 504 2"), then title-case it.
 */
function prettyName(name: string, categoryName: string): string {
  const prefixes = [categoryName, "SILK TIE", "SUITS", "JACKET", "BELT", "TIE"];
  let stripped = name;
  for (const p of prefixes) {
    const re = new RegExp(`^${p}\\s*`, "i");
    if (re.test(stripped)) { stripped = stripped.replace(re, ""); break; }
  }
  return titleCase(stripped);
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

function mapItem(item: ErpItem): LibraryItem {
  const cloth = item.description ? titleCase(item.description) : undefined;
  const detail = [item.brandName, item.design, item.origin].filter(Boolean).map(titleCase).join(" · ");
  const thumb = cleanSrc(item.thumbnail);
  const cleanGallery = (item.images ?? []).map(cleanSrc).filter((g) => g !== FALLBACK_SRC);
  return {
    sku: String(item.id),
    name: prettyName(item.name, item.categoryName),
    type: titleCase(item.categoryName),
    cloth: cloth ?? detail,
    price: `د.ب ${item.sellingPrice}`,
    alt: `${titleCase(item.brandName)} ${titleCase(item.design)} ${titleCase(item.color)}`.trim(),
    description: detail,
    media: { kind: "photo", src: thumb },
    gallery: cleanGallery.length ? cleanGallery : thumb !== FALLBACK_SRC ? [thumb] : undefined,
  };
}

/** Build LibrarySection[] for one slug ('ties' | 'belts' | 'cloths') from ERP. */
export function sectionsFromErp(slug: "ties" | "belts" | "cloths", items: ErpItem[]): LibrarySection[] {
  const wanted = ERP_CATEGORIES_FOR_SLUG[slug];
  const filtered = items.filter((i) => wanted.includes(i.categoryName.toUpperCase()));
  if (filtered.length === 0) return [];

  // Group by brand for a clean sub-section header.
  const groups = new Map<string, ErpItem[]>();
  for (const i of filtered) {
    const b = titleCase(i.brandName || "House");
    groups.set(b, [...(groups.get(b) ?? []), i]);
  }
  return [...groups.entries()].map(([brand, list], idx) => ({
    slug: brand.toLowerCase().replace(/\s+/g, "-") || `section-${idx}`,
    title: brand,
    note: `${list.length} ${list.length === 1 ? "piece" : "pieces"} from ${brand}.`,
    items: list.map(mapItem),
  }));
}

const ERP_CATEGORIES_FOR_SLUG: Record<"ties" | "belts" | "cloths", string[]> = {
  ties:   ["TIE"],
  belts:  ["BELT"],
  cloths: ["SUITING", "JACKETING"],
};

export const ERP_BACKED_SLUGS = ["ties", "belts", "cloths"] as const;
export type ErpBackedSlug = (typeof ERP_BACKED_SLUGS)[number];
export const isErpBacked = (slug: string): slug is ErpBackedSlug =>
  (ERP_BACKED_SLUGS as readonly string[]).includes(slug);
