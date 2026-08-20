/**
 * Public discount-code validator. Customers POST a code + subtotal from
 * the cart and we return either the discount details or a polite reason
 * the code isn't redeemable. We deliberately do NOT let the client read
 * mtm_discount_codes — codes shouldn't be enumerable — so the lookup runs
 * with the service role inside lib/discountServer.
 *
 * The rules themselves live in lib/discountServer so the payment session can
 * apply exactly the same ones without calling this route over HTTP.
 */
import { NextResponse } from "next/server";
import { rateLimit, clientIp, tooMany } from "@/lib/rateLimit";
import { validateDiscount } from "@/lib/discountServer";

export async function POST(req: Request) {
  // The code space is 5 characters (36^3 x 100), small enough to enumerate at
  // speed. Rate limited so guessing a live promo code is not practical.
  const ip = clientIp(req);
  const limited = rateLimit(`discount:${ip}`, 20, 60_000);
  if (!limited.ok) return tooMany(limited.retryAfter);

  const body = await req.json().catch(() => ({}));
  const result = await validateDiscount(body?.code, Number(body?.subtotal));

  if (!result.valid) {
    const { status, ...rest } = result;
    return NextResponse.json(rest, status ? { status } : undefined);
  }
  return NextResponse.json(result);
}
