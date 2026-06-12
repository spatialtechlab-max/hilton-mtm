/**
 * Public lightweight endpoint that returns the set of distinct ERP
 * categoryName values currently carrying at least one active item.
 * Used by the Design Yours picker (client) to hide garment tiles
 * whose categories aren't present in the ERP feed, so customers
 * never see an empty shelf.
 *
 * No auth — the data is the same admin/customer sees on every PDP
 * (just category names, no items). 5-minute ISR cache matches the
 * rest of the ERP-backed surfaces.
 */
import { NextResponse } from "next/server";
import { fetchErpItems } from "@/lib/erp";

export const runtime = "nodejs";
export const revalidate = 300; // 5 minutes

export async function GET() {
  const items = await fetchErpItems();
  const set = new Set<string>();
  // Per-category active-item counts, so the admin garments table can show
  // how many live ERP products sit under each garment's categories.
  const counts: Record<string, number> = {};
  for (const it of items) {
    const cat = (it.categoryName || "").trim().toUpperCase();
    if (cat) {
      set.add(cat);
      counts[cat] = (counts[cat] ?? 0) + 1;
    }
  }
  return NextResponse.json({ categories: Array.from(set).sort(), counts });
}
