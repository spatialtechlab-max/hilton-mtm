/**
 * Order confirmation email. Fired by the client immediately after
 * createOrderFromCart returns successfully. Auth: caller's Supabase
 * JWT, and we additionally verify they own the order (user_id match)
 * before reading the items. RLS on mtm_orders already enforces this on
 * the read path; the manual check is belt-and-braces.
 */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { computeOrderTotals } from "@/lib/checkoutFees";
import { fetchVatRate } from "@/lib/settingsServer";

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(req: Request) {
  if (!SUPA_URL || !ANON) return NextResponse.json({ error: "Supabase env missing" }, { status: 500 });
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const orderId = String(body?.orderId ?? "");
  if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });

  const sb = createClient(SUPA_URL, ANON, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: u, error: ue } = await sb.auth.getUser(token);
  if (ue || !u?.user?.email) return NextResponse.json({ error: "Invalid session." }, { status: 401 });

  const { data: order, error: oe } = await sb.from("mtm_orders").select("*").eq("id", orderId).maybeSingle();
  if (oe || !order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if ((order as { user_id: string }).user_id !== u.user.id) {
    return NextResponse.json({ error: "Not your order." }, { status: 403 });
  }

  const { data: items } = await sb.from("mtm_order_items").select("*").eq("order_id", orderId);
  type Item = { name: string; type_label: string; qty: number; price_num: number; image?: string | null };

  const subtotal     = Number((order as { subtotal: number }).subtotal ?? 0);
  const shipCountry  = (order as { shipping_address?: { country?: string } }).shipping_address?.country ?? null;

  // Server-side check against the admin's free-shipping list. We use the
  // service-role here so the cron-style email path doesn't depend on the
  // caller's auth for the SELECT (the SELECT policy is public anyway, but
  // belt-and-braces).
  const SVC = process.env.SUPABASE_SERVICE_ROLE_KEY;
  let freeShipping = false;
  if (SVC) {
    const svc = createClient(SUPA_URL, SVC);
    const { data: free } = await svc
      .from("mtm_free_shipping_countries")
      .select("country");
    const norm = (s: string | null | undefined) => (s ?? "").trim().toLowerCase();
    const target = norm(shipCountry);
    freeShipping = !!free?.some((r: { country: string }) => norm(r.country) === target) && !!target;
  }

  const vatRate = await fetchVatRate();
  const totals = computeOrderTotals(subtotal, { freeShipping, vatRate });

  const result = await sendOrderConfirmationEmail({
    to: (order as { customer_email: string }).customer_email,
    name: (order as { customer_name: string }).customer_name,
    orderNumber: (order as { order_number: string }).order_number,
    items: ((items as Item[]) ?? []).map((i) => ({
      name: i.name, type_label: i.type_label, qty: i.qty, price_num: i.price_num, image: i.image ?? null,
    })),
    subtotal,
    shippingAddressLine1: (order as { shipping_address?: { line1?: string } }).shipping_address?.line1,
    shippingCity: (order as { shipping_address?: { city?: string } }).shipping_address?.city,
    shippingCountry: (order as { shipping_address?: { country?: string } }).shipping_address?.country,
    discountCode:    (order as { discount_code?: string | null }).discount_code ?? undefined,
    discountPercent: (order as { discount_percent?: number | null }).discount_percent ?? undefined,
    discountAmount:  (order as { discount_amount?: number | null }).discount_amount ?? undefined,
    vat:        totals.vat,
    vatRate:    vatRate,
    shipping:   totals.shipping,
    grandTotal: totals.grandTotal,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ sent: true });
}
