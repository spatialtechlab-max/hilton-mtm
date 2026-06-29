/**
 * Transient image hosting for the ERP push.
 *
 * The ERP's update_item_images.php DOWNLOADS each image URL into its own
 * /uploads and rehosts it (confirmed by a live test). So a generated image only
 * needs to be publicly reachable for the few seconds the ERP takes to fetch it.
 * We PUT it to the VPS (nginx WebDAV at /erpgen/), hand the resulting URL to the
 * ERP, and once the ERP has rehosted it we DELETE our copy. Nothing of ours is
 * stored permanently.
 *
 * Config:
 *   ERP_STORAGE_BASE  e.g. http://<vps-ip>/erpgen   (the WebDAV location)
 *   ERP_SECRET_KEY    reused as the basic-auth password (user "erpgen")
 * GET on the location is public (so the ERP can fetch); PUT/DELETE need auth.
 */
const BASE = (process.env.ERP_STORAGE_BASE || "").replace(/\/+$/, "");
const SECRET = process.env.ERP_SECRET_KEY || "";
const USER = "erpgen";

export function storageConfigured(): boolean {
  return !!BASE && !!SECRET;
}

/** True if a URL points at our own transient store (so it's safe to delete). */
export function isVpsUrl(url: string): boolean {
  return !!BASE && typeof url === "string" && url.startsWith(BASE + "/");
}

function authHeader(): string {
  return "Basic " + Buffer.from(`${USER}:${SECRET}`).toString("base64");
}

function parseDataUrl(dataUrl: string): { buf: Buffer; ext: string; mime: string } | null {
  const m = /^data:([^;]+);base64,(.+)$/s.exec(dataUrl);
  if (!m) return null;
  const mime = m[1].toLowerCase();
  const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";
  return { buf: Buffer.from(m[2], "base64"), ext, mime };
}

export type PutResult = { ok: boolean; url?: string; error?: string };

/** Upload one data: URL to the VPS, return its public http URL. */
export async function putToVps(dataUrl: string, slot: string): Promise<PutResult> {
  if (!BASE) return { ok: false, error: "Transient storage isn't configured (ERP_STORAGE_BASE)." };
  if (!SECRET) return { ok: false, error: "Transient storage isn't configured (ERP_SECRET_KEY)." };
  const parsed = parseDataUrl(dataUrl);
  if (!parsed) return { ok: false, error: "Expected a base64 data: URL." };
  const cleanSlot = (slot || "img").replace(/[^a-z0-9]/gi, "").slice(0, 16) || "img";
  const stamp = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  const name = `${cleanSlot}-${stamp}-${rand}.${parsed.ext}`;
  const url = `${BASE}/${name}`;
  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: { Authorization: authHeader(), "Content-Type": parsed.mime },
      body: new Uint8Array(parsed.buf),
    });
    if (res.status === 201 || res.status === 204 || res.ok) return { ok: true, url };
    return { ok: false, error: `Storage responded ${res.status}.` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Upload to storage failed." };
  }
}

/** Delete one of our transient files. No-op (returns false) for non-VPS URLs. */
export async function deleteFromVps(url: string): Promise<boolean> {
  if (!isVpsUrl(url) || !SECRET) return false;
  try {
    const res = await fetch(url, { method: "DELETE", headers: { Authorization: authHeader() } });
    return res.ok || res.status === 204 || res.status === 404;
  } catch {
    return false;
  }
}
