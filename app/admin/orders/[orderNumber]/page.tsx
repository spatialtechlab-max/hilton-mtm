"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { ArrowLeft, Check, Save, Truck, Send } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { isAdmin } from "@/lib/admin";
import {
  fetchOrderByNumber, ORDER_STATUS_LABEL, ORDER_STATUSES,
  type Order, type OrderItem, type StatusHistoryEntry, type OrderStatus,
} from "@/lib/orders";
import { supabase } from "@/lib/supabase";

const fmt = (n: number) => `BHD ${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

export default function AdminOrderDetailPage() {
  const params = useParams<{ orderNumber: string }>();
  const orderNumber = params?.orderNumber ?? "";
  const { user, loading } = useAuth();
  const [admin, setAdmin]     = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) { setAdmin(false); return; }
    isAdmin(user.email).then(setAdmin);
  }, [user]);

  const [order, setOrder]     = useState<Order | null>(null);
  const [items, setItems]     = useState<OrderItem[]>([]);
  const [history, setHistory] = useState<StatusHistoryEntry[]>([]);
  const [status, setStatus]   = useState<OrderStatus>("placed");
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Courier dispatch form state. Pre-filled from the order so editing
  // existing dispatch details is trivial.
  const [courier, setCourier]       = useState("");
  const [tracking, setTracking]     = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [dispatching, setDispatching] = useState(false);
  const [dispatchNotice, setDispatchNotice] = useState<string | null>(null);
  const [dispatchError, setDispatchError]   = useState<string | null>(null);

  useEffect(() => {
    if (!admin) return;
    let cancelled = false;
    async function load() {
      const r = await fetchOrderByNumber(orderNumber);
      if (cancelled) return;
      setOrder(r.order);
      setItems(r.items);
      setHistory(r.history);
      if (r.order) {
        setStatus(r.order.status);
        setCourier(r.order.courier_name ?? "");
        setTracking(r.order.tracking_number ?? "");
        setTrackingUrl(r.order.tracking_url ?? "");
      }
      setLoadingData(false);
    }
    load();
    return () => { cancelled = true; };
  }, [orderNumber, admin]);

  async function handleSave() {
    if (!order) return;
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? "";
      const res = await fetch("/api/admin/orders/status", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, status }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? "Update failed.");
      setSaved(true);
      setOrder({ ...order, status });
      window.setTimeout(() => setSaved(false), 1800);
      const r = await fetchOrderByNumber(orderNumber);
      setHistory(r.history);
    } finally {
      setSaving(false);
    }
  }

  async function handleDispatch() {
    if (!order) return;
    setDispatchError(null);
    setDispatchNotice(null);
    if (!courier.trim() || !tracking.trim()) {
      setDispatchError("Courier name and tracking number are required.");
      return;
    }
    setDispatching(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? "";
      const res = await fetch("/api/admin/orders/dispatch", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          courier_name: courier.trim(),
          tracking_number: tracking.trim(),
          tracking_url: trackingUrl.trim(),
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? "Dispatch failed.");
      setDispatchNotice(body.emailed ? "Saved. Customer emailed." : "Saved. Email service unavailable — customer not notified yet.");
      const r = await fetchOrderByNumber(orderNumber);
      setOrder(r.order);
      setHistory(r.history);
    } catch (e) {
      setDispatchError(e instanceof Error ? e.message : "Dispatch failed.");
    } finally {
      setDispatching(false);
    }
  }

  if (loading || loadingData || admin === null) return <Shell><p className="text-eyebrow text-[var(--color-charcoal-500)]">Loading…</p></Shell>;
  if (!user)  return <Shell><p>Sign in required.</p></Shell>;
  if (!admin) return <Shell><p>Not authorised.</p></Shell>;
  if (!order) return <Shell><p>Order not found.</p></Shell>;

  return (
    <Shell>
      <header className="border-b border-black/10 pb-8 mb-10">
        <span className="text-eyebrow text-[var(--color-burgundy-700)]">Admin · Order</span>
        <h1 className="text-display text-[clamp(2rem,4vw,3rem)] mt-2 leading-tight tabular-nums">
          {order.order_number}
        </h1>
        <p className="mt-3 text-[0.9rem] text-[var(--color-charcoal-500)]">
          Placed {new Date(order.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} · {fmt(Number(order.subtotal))}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10 lg:gap-16">
        {/* Status update + items */}
        <div>
          <section className="border border-[var(--color-burgundy-700)]/25 bg-[var(--color-burgundy-50)] p-6">
            <h2 className="text-eyebrow text-[var(--color-burgundy-700)]">Update order status</h2>
            <p className="text-[0.85rem] text-[var(--color-charcoal-700)] mt-2">
              Sebastian will deliver the change to the customer&rsquo;s notifications and dashboard the moment you save —
              live, no refresh needed.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as OrderStatus)}
                className="border border-black/15 bg-[var(--color-ivory-100)] px-3 py-2.5 text-[0.95rem] focus:outline-none focus:border-[var(--color-burgundy-700)]"
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || status === order.status}
                className="text-eyebrow inline-flex items-center gap-2 bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] px-5 py-2.5 hover:bg-[var(--color-burgundy-800)] transition-colors disabled:opacity-50"
              >
                {saved ? <><Check size={14} strokeWidth={1.5} /> Saved</> : <><Save size={14} strokeWidth={1.5} /> {saving ? "Saving…" : "Update status"}</>}
              </button>
            </div>
          </section>

          {/* Courier dispatch */}
          <section className="mt-8 border border-black/10 p-6 bg-[var(--color-ivory-100)]">
            <h2 className="text-eyebrow text-[var(--color-burgundy-700)] inline-flex items-center gap-2">
              <Truck size={14} strokeWidth={1.5} /> Courier dispatch
            </h2>
            <p className="text-[0.85rem] text-[var(--color-charcoal-700)] mt-2 mb-5">
              Saving here marks the order as delivered, stamps the dispatch time,
              writes a note to the customer&rsquo;s timeline, and sends them an email with
              the courier + tracking details.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-eyebrow text-[var(--color-charcoal-500)] block mb-1.5">Courier</span>
                <input
                  type="text"
                  value={courier}
                  onChange={(e) => setCourier(e.target.value)}
                  placeholder="DHL, Aramex, BPost…"
                  className="w-full px-3 py-2.5 border border-black/15 bg-[var(--color-ivory-100)] focus:outline-none focus:border-[var(--color-burgundy-700)] text-[0.9rem]"
                />
              </label>
              <label className="block">
                <span className="text-eyebrow text-[var(--color-charcoal-500)] block mb-1.5">Tracking number</span>
                <input
                  type="text"
                  value={tracking}
                  onChange={(e) => setTracking(e.target.value)}
                  placeholder="AWB / consignment number"
                  className="w-full px-3 py-2.5 border border-black/15 bg-[var(--color-ivory-100)] focus:outline-none focus:border-[var(--color-burgundy-700)] text-[0.9rem]"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-eyebrow text-[var(--color-charcoal-500)] block mb-1.5">Tracking URL (optional)</span>
                <input
                  type="url"
                  value={trackingUrl}
                  onChange={(e) => setTrackingUrl(e.target.value)}
                  placeholder="https://…"
                  className="w-full px-3 py-2.5 border border-black/15 bg-[var(--color-ivory-100)] focus:outline-none focus:border-[var(--color-burgundy-700)] text-[0.9rem]"
                />
              </label>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleDispatch}
                disabled={dispatching || !courier.trim() || !tracking.trim()}
                className="text-eyebrow inline-flex items-center gap-2 bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] px-5 py-2.5 hover:bg-[var(--color-burgundy-800)] transition-colors disabled:opacity-50"
              >
                <Send size={14} strokeWidth={1.5} /> {dispatching ? "Saving…" : "Save & notify customer"}
              </button>
              {order.dispatched_at && (
                <span className="text-[0.78rem] text-[var(--color-charcoal-500)]">
                  Last dispatched {new Date(order.dispatched_at).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}
                </span>
              )}
            </div>
            {dispatchNotice && (
              <p className="mt-3 inline-flex items-center gap-2 text-[0.82rem] text-[var(--color-burgundy-700)] bg-[var(--color-burgundy-50)] border border-[var(--color-burgundy-700)]/20 px-3 py-2">
                <Check size={13} strokeWidth={1.5} /> {dispatchNotice}
              </p>
            )}
            {dispatchError && (
              <p className="mt-3 text-[0.82rem] text-[var(--color-burgundy-700)] bg-[var(--color-burgundy-50)] border border-[var(--color-burgundy-700)]/20 px-3 py-2">
                {dispatchError}
              </p>
            )}
          </section>

          {/* Items */}
          <section className="mt-10">
            <h2 className="text-eyebrow text-[var(--color-charcoal-500)] mb-5">Line items ({items.length})</h2>
            <ul className="border-y border-black/10 divide-y divide-black/10">
              {items.map((it) => (
                <li key={it.id} className="py-5 flex gap-5">
                  {it.image && (
                    <div className="relative shrink-0 w-20 h-20 bg-[var(--color-ivory-200)] overflow-hidden">
                      <Image src={it.image} alt={it.name} fill sizes="80px" className="object-cover" unoptimized={it.image.includes("erp.hiltontailoringhouse.com")} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="text-eyebrow text-[var(--color-charcoal-500)]">{it.type_label}</span>
                    <p className="text-display text-[1.1rem] mt-0.5 leading-tight">{it.name}</p>
                    <p className="text-[0.78rem] text-[var(--color-charcoal-500)] mt-1">
                      {it.item_type === "commission" ? "Custom commission" : "Stock item"} · SKU {it.sku} · qty {it.qty}
                    </p>
                    {it.item_type === "commission" && Object.keys(it.custom).length > 0 && (
                      <details className="mt-2 text-[0.8rem]">
                        <summary className="cursor-pointer text-[var(--color-burgundy-700)]">View spec</summary>
                        <pre className="mt-2 bg-[var(--color-ivory-200)] p-3 overflow-x-auto text-[0.72rem]">
                          {JSON.stringify(it.custom, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                  <span className="text-[0.95rem] text-[var(--color-charcoal-900)] tabular-nums whitespace-nowrap">
                    {fmt(Number(it.price_num) * it.qty)}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Status history */}
          <section className="mt-10">
            <h2 className="text-eyebrow text-[var(--color-charcoal-500)] mb-5">Status history</h2>
            <ul className="border border-black/10 divide-y divide-black/10">
              {history.map((h) => (
                <li key={h.id} className="p-4 flex justify-between gap-3 text-[0.9rem]">
                  <span className="text-[var(--color-charcoal-900)]">{ORDER_STATUS_LABEL[h.status]}</span>
                  <span className="text-[var(--color-charcoal-500)] tabular-nums">
                    {new Date(h.changed_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Customer sidebar */}
        <aside className="space-y-6 self-start">
          <div className="border border-black/10 p-6 bg-[var(--color-ivory-200)]">
            <h3 className="text-eyebrow text-[var(--color-charcoal-500)]">Customer</h3>
            <p className="text-display text-[1.1rem] mt-2">{order.customer_name || "—"}</p>
            <p className="text-[0.85rem] text-[var(--color-charcoal-700)] mt-1">{order.customer_email}</p>
            <p className="text-[0.85rem] text-[var(--color-charcoal-700)] tabular-nums">{order.customer_phone || "—"}</p>
          </div>

          <div className="border border-black/10 p-6">
            <h3 className="text-eyebrow text-[var(--color-charcoal-500)]">Shipping</h3>
            <p className="mt-2 text-[0.9rem] text-[var(--color-charcoal-900)] leading-relaxed">
              {order.shipping_address.line1}<br />
              {order.shipping_address.line2 && (<>{order.shipping_address.line2}<br /></>)}
              {order.shipping_address.city}, {order.shipping_address.country}
            </p>
          </div>

          <div className="border border-black/10 p-6">
            <h3 className="text-eyebrow text-[var(--color-charcoal-500)]">Total</h3>
            {order.discount_code && order.discount_amount ? (
              <div className="mt-2 space-y-1 text-[0.85rem]">
                <div className="flex justify-between text-[var(--color-charcoal-500)]">
                  <span>Items</span>
                  <span className="tabular-nums">{fmt(Number(order.subtotal) + Number(order.discount_amount))}</span>
                </div>
                <div className="flex justify-between text-[var(--color-burgundy-700)]">
                  <span>{order.discount_code} · {order.discount_percent}% off</span>
                  <span className="tabular-nums">− {fmt(Number(order.discount_amount))}</span>
                </div>
              </div>
            ) : null}
            <p className="text-display text-[1.75rem] mt-2 text-[var(--color-burgundy-700)] tabular-nums">
              {fmt(Number(order.subtotal))}
            </p>
          </div>
        </aside>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-32 md:pt-40 pb-24 min-h-[80vh]">
      <div className="container-editorial">
        <Link href="/admin/orders" className="inline-flex items-center gap-2 text-eyebrow text-[var(--color-charcoal-500)] hover:text-[var(--color-burgundy-700)] transition-colors mb-8">
          <ArrowLeft size={14} strokeWidth={1.5} /> All orders
        </Link>
        {children}
      </div>
    </div>
  );
}
