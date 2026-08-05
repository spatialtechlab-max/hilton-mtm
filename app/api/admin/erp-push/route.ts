/**
 * "Push to ERP" — send an item's generated images into the ERP
 * (update_item_images.php, matched by barcode). The ERP downloads each URL into
 * its own /uploads and rehosts it, after which the storefront shows them — so
 * this push is effectively "make live."
 *
 * Auth: admin OR operator. Expects already-staged PUBLIC image URLs in `images`
 * (the browser stages them via /api/admin/erp-host first). Once the ERP has
 * rehosted them, we delete our transient VPS copies. ERP keys stay server-side.
 */
import { NextResponse } from "next/server";
import { assertStaff } from "@/lib/staffAuth";
import { pushImagesToErp } from "@/lib/erpPush";
import { deleteFromVps, isVpsUrl } from "@/lib/erpStorage";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const gate = await assertStaff(req);
  if (!gate.ok) return NextResponse.json({ error: gate.msg }, { status: gate.status });

  const body = await req.json().catch(() => ({}));
  const barcode = String(body?.barcode ?? "");
  const images: string[] = Array.isArray(body?.images) ? body.images.map(String) : [];
  if (!barcode.trim()) return NextResponse.json({ error: "A barcode is required to match the ERP item." }, { status: 400 });
  if (images.length === 0) return NextResponse.json({ error: "No image URLs to push." }, { status: 400 });

  const result = await pushImagesToErp(barcode, images);
  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? `ERP responded ${result.status}.`, status: result.status, body: result.body }, { status: 502 });
  }

  // The ERP has downloaded + rehosted them — our transient copies are no longer
  // needed. Best-effort delete; failures here don't fail the push.
  const ours = images.filter(isVpsUrl);
  const cleaned = (await Promise.all(ours.map(deleteFromVps))).filter(Boolean).length;

  return NextResponse.json({
    pushed: true,
    barcode,
    count: result.saved ?? images.length,
    skipped: result.skipped ?? 0,
    erpStatus: result.status,
    cleaned,
    staged: ours.length,
  });
}
