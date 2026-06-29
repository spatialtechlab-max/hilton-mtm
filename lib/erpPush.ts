/**
 * Push generated images for an item back INTO the ERP, via the client's
 * update_item_images.php endpoint. The ERP matches the item by BARCODE (not id)
 * and takes a flat array of image URLs. Once the ERP has them, the storefront
 * shows them automatically (it reads images from the ERP) — so this push is
 * effectively "make it live."
 *
 * Server-only; ERP keys come from env. Images must be PUBLIC URLs (hosted on
 * the VPS). Whether the ERP downloads-and-rehosts those URLs or just stores the
 * reference is confirmed on the first real push (prototype phase) — it doesn't
 * change this call, only whether the VPS copy can later be deleted.
 */
const ERP_BASE = process.env.ERP_BASE_URL;
const KEY      = process.env.ERP_API_KEY;
const SECRET   = process.env.ERP_SECRET_KEY;

export type ErpPushResult = { ok: boolean; status: number; body?: string; error?: string };

export async function pushImagesToErp(barcode: string, images: string[]): Promise<ErpPushResult> {
  if (!ERP_BASE || !KEY || !SECRET) return { ok: false, status: 0, error: "ERP isn't configured (ERP_BASE_URL / keys)." };
  if (!barcode || !barcode.trim()) return { ok: false, status: 0, error: "This item has no barcode to match on in the ERP." };
  const urls = images.filter((u) => typeof u === "string" && /^https?:\/\//i.test(u));
  if (urls.length === 0) return { ok: false, status: 0, error: "No public image URLs to push." };

  try {
    const res = await fetch(`${ERP_BASE}/api/update_item_images.php`, {
      method: "POST",
      headers: { "X-API-KEY": KEY, "X-SECRET-KEY": SECRET, "Content-Type": "application/json" },
      body: JSON.stringify({ barcode, images: urls }),
      cache: "no-store",
    });
    const body = await res.text().catch(() => "");
    return { ok: res.ok, status: res.status, body: body.slice(0, 500) };
  } catch (e) {
    return { ok: false, status: 0, error: e instanceof Error ? e.message : "push failed" };
  }
}
