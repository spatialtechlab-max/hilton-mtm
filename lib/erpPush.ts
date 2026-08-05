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

export type ErpPushResult = { ok: boolean; status: number; body?: string; error?: string; saved?: number; skipped?: number };

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
    // Read the payload, don't just trust the HTTP status. Until 2026-08-05 this
    // endpoint answered every request with 200 and an empty body, so `res.ok`
    // alone reported success for pushes that saved nothing. It now returns
    // {statusCode, data:{savedCount, skippedCount}} on success and
    // {statusCode, error:{message}} on failure.
    let saved: number | undefined;
    let skipped: number | undefined;
    let apiError: string | undefined;
    try {
      const j = JSON.parse(body) as {
        statusCode?: number;
        data?: { savedCount?: number; skippedCount?: number };
        error?: { message?: string };
      };
      saved = j?.data?.savedCount;
      skipped = j?.data?.skippedCount;
      if (j?.error?.message) apiError = j.error.message;
      if (j?.statusCode != null && j.statusCode >= 400 && !apiError) apiError = `ERP returned ${j.statusCode}.`;
    } catch {
      apiError = "The ERP returned a response we could not read.";
    }

    if (!res.ok || apiError) {
      return { ok: false, status: res.status, body: body.slice(0, 500), error: apiError ?? `ERP responded ${res.status}.` };
    }
    if (!saved) {
      return { ok: false, status: res.status, body: body.slice(0, 500), error: "The ERP accepted the request but saved no images." };
    }
    return { ok: true, status: res.status, body: body.slice(0, 500), saved, skipped };
  } catch (e) {
    return { ok: false, status: 0, error: e instanceof Error ? e.message : "push failed" };
  }
}
