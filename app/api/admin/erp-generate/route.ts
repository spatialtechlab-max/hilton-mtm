/**
 * Generate the 3 catalogue images (swatch, front, back) for one ERP item that
 * lacks photos. The operator/admin uploads a fabric photo (multipart); we read
 * the item's category from the live ERP, pick a same-category reference pose,
 * and return the 3 generated images as data URLs for review. Storing them /
 * making them live happens separately (the VPS feed).
 *
 * Auth: admin OR operator. ERP + OpenRouter keys stay server-side.
 */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { ErpItem } from "@/lib/erp";
import { garmentForCategory, findDonor, generateThree, hasOpenRouterKey } from "@/lib/erpGenerate";

export const runtime = "nodejs";
export const maxDuration = 300;

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function assertStaff(req: Request): Promise<{ ok: true } | { ok: false; status: number; msg: string }> {
  if (!SUPA_URL || !ANON) return { ok: false, status: 500, msg: "Supabase env missing" };
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer /, "");
  if (!token) return { ok: false, status: 401, msg: "Sign in required." };
  const userClient = createClient(SUPA_URL, ANON, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: u, error } = await userClient.auth.getUser(token);
  if (error || !u?.user?.email) return { ok: false, status: 401, msg: "Invalid session." };
  const email = u.user.email;
  const [adm, op] = await Promise.all([
    userClient.from("mtm_admins").select("email").ilike("email", email),
    userClient.from("mtm_operators").select("email").ilike("email", email),
  ]);
  const ok = (adm.data?.length ?? 0) > 0 || (op.data?.length ?? 0) > 0;
  if (!ok) return { ok: false, status: 403, msg: "Not authorised." };
  return { ok: true };
}

type ErpResponse = { statusCode: number; data: { total: number; items: ErpItem[] } };
async function fetchErpRaw(): Promise<ErpItem[]> {
  const base = process.env.ERP_BASE_URL, key = process.env.ERP_API_KEY, secret = process.env.ERP_SECRET_KEY;
  if (!base || !key || !secret) return [];
  const res = await fetch(`${base}/api/item_list.php`, {
    method: "POST",
    headers: { "X-API-KEY": key, "X-SECRET-KEY": secret, "Content-Type": "application/json" },
    body: "{}",
    cache: "no-store",
  });
  if (!res.ok) return [];
  const json = (await res.json()) as ErpResponse;
  return json?.statusCode === 200 ? (json.data?.items ?? []) : [];
}

export async function POST(req: Request) {
  const gate = await assertStaff(req);
  if (!gate.ok) return NextResponse.json({ error: gate.msg }, { status: gate.status });
  if (!hasOpenRouterKey()) return NextResponse.json({ error: "Image AI isn't configured yet (OPENROUTER_API_KEY missing on the server)." }, { status: 503 });

  let form: FormData;
  try { form = await req.formData(); } catch { return NextResponse.json({ error: "Expected a file upload." }, { status: 400 }); }
  const itemId = Number(form.get("itemId"));
  const file = form.get("fabric");
  if (!itemId || !(file instanceof File)) return NextResponse.json({ error: "itemId and a fabric image are required." }, { status: 400 });
  if (file.size > 12 * 1024 * 1024) return NextResponse.json({ error: "Image is too large (max 12 MB)." }, { status: 400 });

  const buf = Buffer.from(await file.arrayBuffer());
  const fabricDataUrl = `data:${file.type || "image/jpeg"};base64,${buf.toString("base64")}`;

  const items = await fetchErpRaw();
  const item = items.find((i) => Number(i.id) === itemId);
  if (!item) return NextResponse.json({ error: "Item not found in the ERP." }, { status: 404 });

  const garment = garmentForCategory(item.categoryName);
  if (!garment) {
    return NextResponse.json({ error: `“${item.categoryName}” is an accessory — image generation is for garments only (suit, jacket, overcoat, trousers, shirt).` }, { status: 422 });
  }

  const donor = findDonor(items, item.categoryName);
  const result = await generateThree(garment, donor, fabricDataUrl);

  if (!result.swatch && !result.front && !result.back) {
    return NextResponse.json({ error: "Generation failed — the model returned no images. Try again." }, { status: 502 });
  }

  return NextResponse.json({
    itemId,
    garment: garment.type,
    usedDonorFront: !!donor.front,
    usedDonorBack: !!donor.back,
    images: result, // { swatch, front, back } as data URLs (any may be null)
  });
}
