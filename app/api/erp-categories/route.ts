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
  for (const it of items) {
    const cat = (it.categoryName || "").trim().toUpperCase();
    if (cat) set.add(cat);
  }
  return NextResponse.json({ categories: Array.from(set).sort() });
}
