/**
 * Raw ERP feed for the admin ERP dashboard. Hits the ERP item list LIVE
 * (cache: no-store) and returns it UNFILTERED — every item, every status,
 * every field — plus category and brand groupings derived from the items.
 * This is deliberately different from lib/erp.ts (which filters to active
 * items and caches for the storefront): here nothing is dropped.
 *
 * Auth: admin OR operator JWT (the ERP image tool is the operator's surface).
 * ERP keys stay server-side.
 */
import { NextResponse } from "next/server";
import type { ErpItem } from "@/lib/erp";
import { assertStaff } from "@/lib/staffAuth";

export const runtime = "nodejs";

type ErpResponse = { statusCode: number; data: { total: number; items: ErpItem[] } };

export async function GET(req: Request) {
  const gate = await assertStaff(req);
  if (!gate.ok) return NextResponse.json({ error: gate.msg }, { status: gate.status });

  const base = process.env.ERP_BASE_URL;
  const key = process.env.ERP_API_KEY;
  const secret = process.env.ERP_SECRET_KEY;
  if (!base || !key || !secret) return NextResponse.json({ error: "ERP isn't configured (missing ERP_BASE_URL / keys)." }, { status: 500 });

  let items: ErpItem[] = [];
  let erpTotal = 0;
  try {
    const res = await fetch(`${base}/api/item_list.php`, {
      method: "POST",
      headers: { "X-API-KEY": key, "X-SECRET-KEY": secret, "Content-Type": "application/json" },
      body: "{}",
      cache: "no-store",                 // live, every load
    });
    if (!res.ok) return NextResponse.json({ error: `ERP responded ${res.status}.` }, { status: 502 });
    const json = (await res.json()) as ErpResponse;
    if (json?.statusCode !== 200) return NextResponse.json({ error: `ERP returned statusCode ${json?.statusCode}.` }, { status: 502 });
    items = json.data?.items ?? [];      // NO status filter — everything
    erpTotal = json.data?.total ?? items.length;
  } catch {
    return NextResponse.json({ error: "Could not reach the ERP." }, { status: 502 });
  }

  // Derive category + brand groupings across ALL items (active and not).
  const catMap = new Map<number, { categoryID: number; categoryName: string; count: number; active: number; inactive: number }>();
  const brandMap = new Map<number, { brandID: number; brandName: string; count: number }>();
  let active = 0, inactive = 0;
  for (const it of items) {
    const isA = it.status === "A";
    if (isA) active++; else inactive++;
    const cName = (it.categoryName || "").trim() || "(no category)";
    const cat = catMap.get(it.categoryID) ?? { categoryID: it.categoryID, categoryName: cName, count: 0, active: 0, inactive: 0 };
    cat.count++; if (isA) cat.active++; else cat.inactive++;
    catMap.set(it.categoryID, cat);
    const bName = (it.brandName || "").trim() || "(no brand)";
    const brand = brandMap.get(it.brandID) ?? { brandID: it.brandID, brandName: bName, count: 0 };
    brand.count++;
    brandMap.set(it.brandID, brand);
  }
  const categories = [...catMap.values()].sort((a, b) => a.categoryName.localeCompare(b.categoryName));
  const brands = [...brandMap.values()].sort((a, b) => a.brandName.localeCompare(b.brandName));

  return NextResponse.json({
    fetchedAt: new Date().toISOString(),
    erpTotal,
    counts: { items: items.length, active, inactive, categories: categories.length, brands: brands.length },
    categories,
    brands,
    items,                                // full raw records, every field
  });
}
