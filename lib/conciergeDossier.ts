/**
 * Customer dossier for Sebastian, the concierge.
 *
 * When the visitor is signed in, this assembles a compact, read-only summary
 * of THEIR profile, measurements, orders (status, amounts, courier/tracking)
 * and the atelier's recent notes, so Sebastian can answer "where's my order",
 * "how much was it", "is it delivered", "what are my measurements" etc. from
 * real data instead of guessing.
 *
 * Everything is read with the visitor's own JWT under RLS, so Sebastian can
 * only ever see what the signed-in customer is allowed to see — never another
 * customer's account. Returns null for guests (they get the normal
 * recommendation experience).
 *
 * The totals here mirror lib/checkoutFees.ts and the order pages exactly
 * (subtotal + 10% VAT + 15 BHD delivery unless the destination is on the
 * free-shipping list) so the figure Sebastian quotes matches what the
 * customer sees on their own order page.
 */
import { createClient } from "@supabase/supabase-js";

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const VAT_RATE = 0.10;
const SHIPPING_FEE = 15;
const round2 = (n: number) => Math.round(n * 100) / 100;
const bhd = (n: number) => `BHD ${n.toFixed(2)}`;

const STATUS_LABEL: Record<string, string> = {
  placed: "Order placed",
  confirmed: "Confirmed by atelier",
  cloth_received: "Cloth received",
  cutting: "On the cutting bench",
  in_production: "In production",
  fitting_ready: "Ready for fitting",
  finishing: "Finishing",
  ready_for_pickup: "Ready for pickup",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const MEAS_LABEL: Record<string, string> = {
  "shirt-neck": "Neck", shoulder: "Shoulder", chest: "Chest", stomach: "Stomach",
  "jacket-hips": "Jacket hips", "jacket-shirt-length": "Jacket/shirt length",
  "sleeve-length": "Sleeve length", bicep: "Bicep", wrist: "Wrist",
  waist: "Waist", crotch: "Crotch", thigh: "Thigh", knee: "Knee", "pants-length": "Pants length",
};

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

type OrderRow = {
  order_number: string;
  status: string;
  subtotal: number | null;
  shipping_address: { city?: string; country?: string } | null;
  discount_code: string | null;
  courier_name: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  dispatched_at: string | null;
  created_at: string;
  mtm_order_items: { name: string; type_label: string; qty: number }[] | null;
};

type NoteRow = {
  note: string;
  status: string;
  changed_at: string;
  mtm_orders: { order_number: string } | { order_number: string }[] | null;
};

/** Returns a formatted dossier block, or null for guests / on any error. */
export async function buildCustomerDossier(req: Request): Promise<string | null> {
  if (!SUPA_URL || !ANON) return null;
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return null;

  try {
    const sb = createClient(SUPA_URL, ANON, { global: { headers: { Authorization: `Bearer ${token}` } } });
    const { data: u } = await sb.auth.getUser(token);
    if (!u?.user?.id) return null;
    const uid = u.user.id;
    const email = u.user.email ?? "";

    const [profileRes, ordersRes, notesRes, freeRes, measRes] = await Promise.all([
      sb.from("mtm_profiles").select("full_name, phone, city, country").eq("id", uid).maybeSingle(),
      sb.from("mtm_orders")
        .select("order_number, status, subtotal, shipping_address, discount_code, courier_name, tracking_number, tracking_url, dispatched_at, created_at, mtm_order_items(name, type_label, qty)")
        .order("created_at", { ascending: false })
        .limit(8),
      sb.from("mtm_order_status_history")
        .select("note, status, changed_at, mtm_orders(order_number)")
        .neq("note", "")
        .order("changed_at", { ascending: false })
        .limit(8),
      sb.from("mtm_free_shipping_countries").select("country"),
      sb.from("mtm_measurements").select("values, unit").eq("user_id", uid).maybeSingle(),
    ]);

    const profile = profileRes.data as { full_name?: string; phone?: string; city?: string; country?: string } | null;
    const orders = (ordersRes.data ?? []) as unknown as OrderRow[];
    const notes = (notesRes.data ?? []) as unknown as NoteRow[];
    const free = ((freeRes.data ?? []) as { country: string }[]).map((c) => (c.country || "").trim().toLowerCase());
    const meas = measRes.data as { values?: Record<string, string>; unit?: string } | null;

    const lines: string[] = [];
    lines.push(
      "CUSTOMER DOSSIER — this is the signed-in visitor. Answer any account, order, status, amount, delivery, tracking or measurement question ONLY from the facts below. Never invent an order, a status, a figure or a date. If they ask about something not listed here, say plainly that you don't see it on their account.",
    );
    lines.push("");

    const name = profile?.full_name?.trim() || (email ? email.split("@")[0] : "the customer");
    lines.push(`Name: ${name}`);
    if (email) lines.push(`Email: ${email}`);
    if (profile?.phone) lines.push(`Phone: ${profile.phone}`);
    const loc = [profile?.city, profile?.country].filter(Boolean).join(", ");
    if (loc) lines.push(`Location on file: ${loc}`);

    if (meas?.values && Object.keys(meas.values).length) {
      const unit = meas.unit || "cm";
      const parts = Object.entries(meas.values)
        .filter(([, v]) => String(v).trim() !== "")
        .map(([k, v]) => `${MEAS_LABEL[k] || k} ${v}${unit}`);
      lines.push(`Saved measurements (${parts.length}): ${parts.join(", ")}`);
    } else {
      lines.push("Saved measurements: none on file.");
    }

    lines.push("");
    if (orders.length === 0) {
      lines.push("ORDERS: none yet — the customer has not placed a commission.");
    } else {
      lines.push("ORDERS (most recent first):");
      orders.forEach((o, i) => {
        const freeShip = free.includes((o.shipping_address?.country || "").trim().toLowerCase());
        const itemsTotal = Math.max(0, round2(Number(o.subtotal) || 0));
        const vat = round2(itemsTotal * VAT_RATE);
        const shipping = freeShip ? 0 : SHIPPING_FEE;
        const total = round2(itemsTotal + vat + shipping);
        const items = (o.mtm_order_items || []).map((it) => `${it.name}${it.qty > 1 ? ` x${it.qty}` : ""}`).join(", ") || "—";
        lines.push(`${i + 1}. Order ${o.order_number} — placed ${fmtDate(o.created_at)} — status: ${STATUS_LABEL[o.status] || o.status}`);
        lines.push(`   Items: ${items}`);
        lines.push(`   Subtotal ${bhd(itemsTotal)} · VAT ${bhd(vat)} · Delivery ${shipping ? bhd(shipping) : "free"} · Total ${bhd(total)}${o.discount_code ? ` (discount code ${o.discount_code} applied)` : ""}`);
        const ship = [o.shipping_address?.city, o.shipping_address?.country].filter(Boolean).join(", ");
        if (ship) lines.push(`   Ship to: ${ship}`);
        if (o.courier_name || o.tracking_number) {
          lines.push(`   Dispatched via ${o.courier_name || "courier"}${o.tracking_number ? `, tracking ${o.tracking_number}` : ""}${o.tracking_url ? ` (${o.tracking_url})` : ""}${o.dispatched_at ? ` on ${fmtDate(o.dispatched_at)}` : ""}`);
        } else if (o.status !== "delivered" && o.status !== "cancelled") {
          lines.push("   Not yet dispatched.");
        }
      });
    }

    if (notes.length) {
      lines.push("");
      lines.push("RECENT ATELIER NOTES (these are the customer's notifications):");
      notes.forEach((n) => {
        const ord = Array.isArray(n.mtm_orders) ? n.mtm_orders[0] : n.mtm_orders;
        const num = ord?.order_number || "";
        lines.push(`- ${num ? `${num} · ` : ""}${STATUS_LABEL[n.status] || n.status} · "${n.note}" (${fmtDate(n.changed_at)})`);
      });
    }

    lines.push("");
    lines.push(
      "Payment note: the house records order totals, not online payment receipts. If asked whether an order is paid, quote the order total and say settlement is arranged directly with the atelier.",
    );

    return lines.join("\n");
  } catch {
    return null;
  }
}
