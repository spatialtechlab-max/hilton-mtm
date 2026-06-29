/**
 * Stage one generated image on the transient VPS store and return its public
 * URL. The browser calls this once per image (each well under Vercel's request
 * limit) before calling /api/admin/erp-push with the resulting URLs.
 *
 * Auth: admin OR operator. The image arrives as a base64 data: URL.
 */
import { NextResponse } from "next/server";
import { assertStaff } from "@/lib/staffAuth";
import { putToVps } from "@/lib/erpStorage";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const gate = await assertStaff(req);
  if (!gate.ok) return NextResponse.json({ error: gate.msg }, { status: gate.status });

  const body = await req.json().catch(() => ({}));
  const dataUrl = String(body?.dataUrl ?? "");
  const slot = String(body?.slot ?? "img");
  if (!dataUrl.startsWith("data:")) return NextResponse.json({ error: "A base64 data: URL is required." }, { status: 400 });

  const result = await putToVps(dataUrl, slot);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 });
  return NextResponse.json({ url: result.url });
}
