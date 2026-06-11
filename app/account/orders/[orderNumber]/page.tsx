"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { ArrowLeft, Check, Truck, ScrollText } from "lucide-react";
import {
  fetchOrderByNumber, ORDER_STATUS_LABEL, ORDER_STATUSES,
  type Order, type OrderItem, type StatusHistoryEntry,
} from "@/lib/orders";
import { OrderPhotosGrid } from "@/components/OrderPhotosGrid";
import { computeOrderTotals, VAT_RATE } from "@/lib/checkoutFees";
import { listFreeShippingCountries, isFreeShippingCountry, type FreeShippingCountry } from "@/lib/shippingZones";
import { supabase } from "@/lib/supabase";

const fmt = (n: number) => `BHD ${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

export default function OrderDetailPage() {
  const params = useParams<{ orderNumber: string }>();
  const orderNumber = params?.orderNumber ?? "";

  const [order, setOrder]     = useState<Order | null>(null);
  const [items, setItems]     = useState<OrderItem[]>([]);
  const [history, setHistory] = useState<StatusHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [freeCountries, setFreeCountries] = useState<FreeShippingCountry[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await listFreeShippingCountries();
      if (!cancelled) setFreeCountries(list);
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const r = await fetchOrderByNumber(orderNumber);
      if (cancelled) return;
      setOrder(r.order);
      setItems(r.items);
      setHistory(r.history);
      setLoading(false);
    }
    load();

    // Realtime: when admin updates this order, refresh.
    const channel = supabase
      .channel(`order-${orderNumber}`)
      .on("postgres_changes",
          { event: "UPDATE", schema: "public", table: "mtm_orders", filter: `order_number=eq.${orderNumber}` },
          () => load())
      .on("postgres_changes",
          { event: "INSERT", schema: "public", table: "mtm_order_status_history" },
          () => load())
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [orderNumber]);

  if (loading) {
    return <div className="pt-40 pb-24 min-h-[70vh] container-editorial text-eyebrow text-[var(--color-charcoal-500)]">Loading…</div>;
  }
  if (!order) {
    return (
      <div className="pt-32 md:pt-40 pb-24 container-editorial min-h-[70vh]">
        <Link href="/account" className="inline-flex items-center gap-2 text-eyebrow text-[var(--color-charcoal-500)] hover:text-[var(--color-burgundy-700)] transition-colors">
          <ArrowLeft size={14} strokeWidth={1.5} /> Back to account
        </Link>
        <h1 className="text-display text-[clamp(2rem,4vw,3rem)] mt-6">Order not found.</h1>
      </div>
    );
  }

  const currentIdx = ORDER_STATUSES.indexOf(order.status);
  const visibleStatuses = ORDER_STATUSES.filter((s) => s !== "cancelled");

  return (
    <div className="pt-32 md:pt-40 pb-24 min-h-[80vh]">
      <div className="container-editorial">
        <div className="mx-auto max-w-[1100px]">
          <Link href="/account" className="inline-flex items-center gap-2 text-eyebrow text-[var(--color-charcoal-500)] hover:text-[var(--color-burgundy-700)] transition-colors mb-6">
            <ArrowLeft size={14} strokeWidth={1.5} /> Back to account
          </Link>

          <div className="border-b border-black/10 pb-8">
            <span className="text-eyebrow text-[var(--color-burgundy-700)]">Order</span>
            <h1 className="text-display text-[clamp(2rem,4vw,3rem)] mt-2 leading-tight tabular-nums">
              {order.order_number}
            </h1>
            <p className="mt-3 text-[0.9rem] text-[var(--color-charcoal-500)]">
              Placed {new Date(order.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
              {" · "}{fmt(computeOrderTotals(order.subtotal, { freeShipping: isFreeShippingCountry(order.shipping_address.country, freeCountries) }).grandTotal)}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10 lg:gap-16 mt-10">
            {/* Status timeline + items */}
            <div>
              {/* Status timeline */}
              <section>
                <h2 className="text-eyebrow text-[var(--color-charcoal-500)] mb-5">Progress</h2>
                <ol className="border-l border-black/15 pl-5 space-y-4">
                  {visibleStatuses.map((s) => {
                    const i = ORDER_STATUSES.indexOf(s);
                    const done = i <= currentIdx;
                    const current = i === currentIdx;
                    return (
                      <li key={s} className="relative">
                        <span className={`absolute -left-[27px] top-0.5 inline-flex items-center justify-center w-4 h-4 rounded-full border ${
                          done
                            ? "bg-[var(--color-burgundy-700)] border-[var(--color-burgundy-700)] text-[var(--color-ivory-100)]"
                            : "bg-[var(--color-ivory-100)] border-black/20"
                        }`}>
                          {done && <Check size={9} strokeWidth={3} />}
                        </span>
                        <p className={`text-[0.95rem] ${current ? "text-display text-[1.05rem] text-[var(--color-burgundy-700)]" : done ? "text-[var(--color-charcoal-900)]" : "text-[var(--color-charcoal-500)]"}`}>
                          {ORDER_STATUS_LABEL[s]}
                        </p>
                        {current && order.status !== "cancelled" && (
                          <p className="text-[0.78rem] text-[var(--color-charcoal-500)] mt-0.5">
                            Updated {new Date(order.updated_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ol>
                {order.status === "cancelled" && (
                  <p className="mt-5 text-[0.9rem] text-[var(--color-burgundy-700)] inline-flex items-center gap-2">
                    This order was cancelled.
                  </p>
                )}
              </section>

              {/* Courier dispatch — only shown once the atelier has
                  saved tracking details. */}
              {order.courier_name && order.tracking_number && (
                <section className="mt-10 border border-[var(--color-burgundy-700)]/20 bg-[var(--color-burgundy-50)] p-6">
                  <h2 className="text-eyebrow text-[var(--color-burgundy-700)]">On its way</h2>
                  <p className="mt-2 text-[0.95rem] text-[var(--color-charcoal-800)]">
                    Your commission has been dispatched via{" "}
                    <strong className="font-normal text-[var(--color-charcoal-900)]">{order.courier_name}</strong>.
                  </p>
                  <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                    <div>
                      <dt className="text-eyebrow text-[var(--color-charcoal-500)]">Tracking number</dt>
                      <dd className="text-[0.95rem] text-[var(--color-charcoal-900)] mt-1 tabular-nums break-words">
                        {order.tracking_url ? (
                          <a href={order.tracking_url} target="_blank" rel="noopener noreferrer" className="underline hover:text-[var(--color-burgundy-700)] transition-colors">
                            {order.tracking_number}
                          </a>
                        ) : (
                          order.tracking_number
                        )}
                      </dd>
                    </div>
                    {order.dispatched_at && (
                      <div>
                        <dt className="text-eyebrow text-[var(--color-charcoal-500)]">Dispatched</dt>
                        <dd className="text-[0.95rem] text-[var(--color-charcoal-900)] mt-1">
                          {new Date(order.dispatched_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                        </dd>
                      </div>
                    )}
                  </dl>
                </section>
              )}

              {/* Items */}
              <section className="mt-12">
                <h2 className="text-eyebrow text-[var(--color-charcoal-500)] mb-5 inline-flex items-center gap-2">
                  <ScrollText size={14} strokeWidth={1.5} /> Items in this order
                </h2>
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
                          {it.item_type === "commission" ? "Custom commission" : "Stock item"} · qty {it.qty}
                        </p>
                      </div>
                      <span className="text-[0.95rem] text-[var(--color-charcoal-900)] tabular-nums whitespace-nowrap">
                        {fmt(it.price_num * it.qty)}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Body photographs — only renders when the customer
                  uploaded at least one at checkout. */}
              <OrderPhotosGrid orderId={order.id} audience="customer" />
            </div>

            {/* Sidebar — delivery, summary */}
            <aside className="self-start space-y-8">
              <div className="border border-black/10 p-6 bg-[var(--color-ivory-200)]">
                <h3 className="text-eyebrow text-[var(--color-charcoal-500)] inline-flex items-center gap-2">
                  <Truck size={14} strokeWidth={1.5} /> Shipping to
                </h3>
                <p className="mt-3 text-[0.95rem] text-[var(--color-charcoal-900)] leading-relaxed">
                  {order.customer_name}<br />
                  {order.shipping_address.line1}<br />
                  {order.shipping_address.line2 && (<>{order.shipping_address.line2}<br /></>)}
                  {order.shipping_address.city}, {order.shipping_address.country}
                </p>
                <p className="mt-3 text-[0.82rem] text-[var(--color-charcoal-500)]">
                  {order.customer_phone}
                </p>
              </div>

              <div className="border border-black/10 p-6">
                <h3 className="text-eyebrow text-[var(--color-charcoal-500)]">Total</h3>
                {(() => {
                  const freeShipping = isFreeShippingCountry(order.shipping_address.country, freeCountries);
                  const totals = computeOrderTotals(order.subtotal, { freeShipping });
                  return (
                    <>
                      <div className="mt-2 space-y-1 text-[0.85rem]">
                        <div className="flex justify-between text-[var(--color-charcoal-500)]">
                          <span>Items</span>
                          <span className="tabular-nums">
                            {fmt(order.subtotal + (order.discount_amount ?? 0))}
                          </span>
                        </div>
                        {order.discount_code && order.discount_amount ? (
                          <div className="flex justify-between text-[var(--color-burgundy-700)]">
                            <span>{order.discount_code} · {order.discount_percent}% off</span>
                            <span className="tabular-nums">− {fmt(order.discount_amount)}</span>
                          </div>
                        ) : null}
                        <div className="flex justify-between text-[var(--color-charcoal-500)]">
                          <span>VAT ({Math.round(VAT_RATE * 100)}%)</span>
                          <span className="tabular-nums">{fmt(totals.vat)}</span>
                        </div>
                        <div className="flex justify-between text-[var(--color-charcoal-500)]">
                          <span>Shipping</span>
                          {freeShipping ? (
                            <span className="text-eyebrow text-[var(--color-burgundy-700)]">Free</span>
                          ) : (
                            <span className="tabular-nums">{fmt(totals.shipping)}</span>
                          )}
                        </div>
                      </div>
                      <p className="text-display text-[1.75rem] mt-2 text-[var(--color-burgundy-700)] tabular-nums">
                        {fmt(totals.grandTotal)}
                      </p>
                    </>
                  );
                })()}
              </div>

              {history.length > 0 && (
                <div className="border border-black/10 p-6">
                  <h3 className="text-eyebrow text-[var(--color-charcoal-500)]">Updates</h3>
                  <ul className="mt-3 space-y-2 text-[0.85rem]">
                    {history.map((h) => (
                      <li key={h.id} className="flex justify-between gap-3">
                        <span className="text-[var(--color-charcoal-900)]">{ORDER_STATUS_LABEL[h.status]}</span>
                        <span className="text-[var(--color-charcoal-500)] tabular-nums shrink-0">
                          {new Date(h.changed_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
