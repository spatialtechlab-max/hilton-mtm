/**
 * Server-side discount validation, shared by the public validator route and by
 * the payment session.
 *
 * WHY THIS EXISTS
 * The payment route used to validate a code by making an HTTP request back to
 * our own /api/discount-codes/validate, building the URL from `req.url`. That
 * call was wrapped in `catch { /* fall through at full price *\/ }`, so any
 * hiccup in the round trip silently dropped the discount and charged the
 * customer the full amount. Caught on the live site: the validator returned
 * `{valid:true, amount:35}` for a 20% code while the session charged 192.5
 * instead of 154 and stored discount_code as null. The customer would have
 * been billed full price with no indication anything was wrong.
 *
 * A route calling itself over the network to run a database query is a
 * failure mode with no upside, so the logic lives here and both callers invoke
 * it directly. No socket, no origin guessing, no silent fallback.
 */
import { createClient } from "@supabase/supabase-js";

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** 3 alphanumeric then 2 digits, e.g. DIS25. Mirrors the DB CHECK constraint. */
export const CODE_REGEX = /^[A-Z0-9]{3}[0-9]{2}$/;

export type DiscountResult =
  | { valid: true; code: string; percent_off: number; amount: number }
  | { valid: false; reason: string; status?: number };

/**
 * Resolve a discount code against the live table.
 *
 * @param codeRaw  as typed by the customer; trimmed and upper-cased here
 * @param subtotal the pre-discount items total, already priced server-side
 */
export async function validateDiscount(codeRaw: unknown, subtotal: number): Promise<DiscountResult> {
  if (!SUPA_URL || !SERVICE) return { valid: false, reason: "Service unavailable.", status: 500 };

  const code = (typeof codeRaw === "string" ? codeRaw : "").trim().toUpperCase();
  if (!code || !CODE_REGEX.test(code)) return { valid: false, reason: "That code doesn't look right." };
  if (!Number.isFinite(subtotal) || subtotal <= 0) return { valid: false, reason: "Subtotal required." };

  const admin = createClient(SUPA_URL, SERVICE, { auth: { persistSession: false } });
  const { data, error } = await admin
    .from("mtm_discount_codes")
    .select("id,code,percent_off,starts_at,ends_at,active")
    .eq("code", code)
    .maybeSingle();

  if (error) return { valid: false, reason: "Couldn't check that code.", status: 500 };
  if (!data) return { valid: false, reason: "We don't recognise that code." };
  if (!data.active) return { valid: false, reason: "That code isn't currently active." };

  const now = Date.now();
  const start = Date.parse(data.starts_at);
  const end = Date.parse(data.ends_at);
  if (Number.isFinite(start) && now < start) return { valid: false, reason: "That code isn't open yet." };
  if (Number.isFinite(end) && now > end) return { valid: false, reason: "That code has expired." };

  // Round at the boundary so the order row, the email and the amount charged
  // all carry the identical figure.
  const amount = Math.round(((subtotal * data.percent_off) / 100) * 100) / 100;
  return { valid: true, code: data.code, percent_off: data.percent_off, amount };
}
