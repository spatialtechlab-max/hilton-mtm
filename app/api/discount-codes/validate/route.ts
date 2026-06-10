/**
 * Public discount-code validator. Customers POST a code + subtotal from
 * the cart and we return either the discount details or a polite reason
 * the code isn't redeemable. We deliberately do NOT let the client read
 * mtm_discount_codes — codes shouldn't be enumerable — so this route
 * uses the service-role key to look up the row.
 */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CODE_REGEX = /^[A-Z0-9]{3}[0-9]{2}$/;

export async function POST(req: Request) {
  if (!SUPA_URL || !SERVICE) {
    return NextResponse.json({ valid: false, reason: "Service unavailable." }, { status: 500 });
  }

  const body = await req.json().catch(() => ({}));
  const codeRaw = typeof body?.code === "string" ? body.code : "";
  const subtotal = Number(body?.subtotal);
  const code = codeRaw.trim().toUpperCase();

  if (!code || !CODE_REGEX.test(code)) {
    return NextResponse.json({ valid: false, reason: "That code doesn't look right." });
  }
  if (!Number.isFinite(subtotal) || subtotal <= 0) {
    return NextResponse.json({ valid: false, reason: "Subtotal required." });
  }

  const admin = createClient(SUPA_URL, SERVICE, { auth: { persistSession: false } });
  const { data, error } = await admin
    .from("mtm_discount_codes")
    .select("id,code,percent_off,starts_at,ends_at,active")
    .eq("code", code)
    .maybeSingle();
  if (error) {
    return NextResponse.json({ valid: false, reason: "Couldn't check that code." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ valid: false, reason: "We don't recognise that code." });
  }
  if (!data.active) {
    return NextResponse.json({ valid: false, reason: "That code isn't currently active." });
  }
  const now = Date.now();
  const start = Date.parse(data.starts_at);
  const end   = Date.parse(data.ends_at);
  if (Number.isFinite(start) && now < start) {
    return NextResponse.json({ valid: false, reason: "That code isn't open yet." });
  }
  if (Number.isFinite(end) && now > end) {
    return NextResponse.json({ valid: false, reason: "That code has expired." });
  }

  // Round to 2dp at the boundary — order persistence happens with this
  // same value to keep the email + admin view honest.
  const amount = Math.round((subtotal * data.percent_off) / 100 * 100) / 100;

  return NextResponse.json({
    valid: true,
    code: data.code,
    percent_off: data.percent_off,
    amount,
  });
}
