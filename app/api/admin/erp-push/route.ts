/**
 * "Push to ERP" — send an item's generated images into the ERP
 * (update_item_images.php, matched by barcode). The storefront then shows them
 * automatically, so this is effectively "make live."
 *
 * Auth: admin OR operator. Expects already-hosted PUBLIC image URLs in `images`
 * (the VPS-hosting step that turns the generated data into URLs is wired in the
 * prototype phase). ERP keys stay server-side.
 */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { pushImagesToErp } from "@/lib/erpPush";

export const runtime = "nodejs";

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
  if ((adm.data?.length ?? 0) === 0 && (op.data?.length ?? 0) === 0) return { ok: false, status: 403, msg: "Not authorised." };
  return { ok: true };
}

export async function POST(req: Request) {
  const gate = await assertStaff(req);
  if (!gate.ok) return NextResponse.json({ error: gate.msg }, { status: gate.status });

  const body = await req.json().catch(() => ({}));
  const barcode = String(body?.barcode ?? "");
  const images: string[] = Array.isArray(body?.images) ? body.images.map(String) : [];
  if (!barcode.trim()) return NextResponse.json({ error: "A barcode is required to match the ERP item." }, { status: 400 });
  if (images.length === 0) return NextResponse.json({ error: "No image URLs to push." }, { status: 400 });

  const result = await pushImagesToErp(barcode, images);
  if (!result.ok) return NextResponse.json({ error: result.error ?? `ERP responded ${result.status}.`, status: result.status, body: result.body }, { status: 502 });

  return NextResponse.json({ pushed: true, barcode, count: images.length, erpStatus: result.status });
}
