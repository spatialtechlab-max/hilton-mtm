"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Check, Save, Send, Package } from "lucide-react";
import {
  fetchOrderByNumber,
  updateOrderStatus,
  postOrderMessage,
  ORDER_STATUSES,
  ORDER_STATUS_LABEL,
  type Order,
  type OrderItem,
  type OrderStatus,
  type StatusHistoryEntry,
} from "@/lib/orders";

const fmt = (n: number) =>
  `د.ب ${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

/**
 * The big admin pop-up. Open from a click on any row in /admin/orders.
 * Every action the atelier needs lives here:
 *   - read the commission (items + spec + shipping + customer)
 *   - update the status (the change pushes to the customer's bell live)
 *   - write a free-form message that lands in the customer's notifications
 *     under Sebastian's voice — same channel the timeline reads from.
 */
export function OrderDetailModal({
  orderNumber,
  onClose,
  onUpdated,
}: {
  orderNumber: string | null;
  onClose: () => void;
  onUpdated?: () => void;
}) {
  const isOpen = !!orderNumber;

  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [history, setHistory] = useState<StatusHistoryEntry[]>([]);
  const [status, setStatus] = useState<OrderStatus>("placed");
  const [message, setMessage] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);
  const [savedStatus, setSavedStatus] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [sentMessage, setSentMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // (Re)load when the modal opens on a new order. Clear state when closed.
  useEffect(() => {
    if (!orderNumber) {
      setOrder(null);
      setItems([]);
      setHistory([]);
      setMessage("");
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchOrderByNumber(orderNumber)
      .then((r) => {
        if (cancelled) return;
        setOrder(r.order);
        setItems(r.items);
        setHistory(r.history);
        if (r.order) setStatus(r.order.status);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [orderNumber]);

  // Close on Escape.
  useEffect(() => {
    if (!isOpen) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [isOpen, onClose]);

  // Lock background scroll while modal is open.
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  async function handleSaveStatus() {
    if (!order || status === order.status) return;
    setError(null);
    setSavingStatus(true);
    const { error: err } = await updateOrderStatus(order.id, status);
    setSavingStatus(false);
    if (err) {
      setError(err);
      return;
    }
    setSavedStatus(true);
    setOrder({ ...order, status });
    window.setTimeout(() => setSavedStatus(false), 1800);
    onUpdated?.();
    // Refresh history so the new status row appears
    const r = await fetchOrderByNumber(order.order_number);
    setHistory(r.history);
  }

  async function handleSendMessage() {
    if (!order || !message.trim()) return;
    setError(null);
    setSendingMessage(true);
    const { error: err } = await postOrderMessage(order.id, order.status, message);
    setSendingMessage(false);
    if (err) {
      setError(err);
      return;
    }
    setSentMessage(true);
    setMessage("");
    window.setTimeout(() => setSentMessage(false), 1800);
    const r = await fetchOrderByNumber(order.order_number);
    setHistory(r.history);
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
          className="fixed inset-0 bg-[var(--color-charcoal-900)]/55 backdrop-blur-sm z-[80] grid place-items-center p-4"
        >
          <motion.div
            key="panel"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="bg-[var(--color-ivory-100)] w-[min(98vw,1100px)] max-h-[92vh] overflow-hidden flex flex-col border border-black/10 shadow-2xl shadow-black/30"
            role="dialog"
            aria-label="Order details"
          >
            {/* Header */}
            <header className="flex items-center justify-between gap-4 px-6 py-4 border-b border-black/10 bg-[var(--color-ivory-200)]">
              <div className="min-w-0">
                <div className="text-eyebrow text-[var(--color-burgundy-700)] text-[0.62rem]">
                  Atelier · Commission
                </div>
                <div className="text-display text-[1.4rem] mt-1 tabular-nums text-[var(--color-charcoal-900)]">
                  {order?.order_number ?? orderNumber}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="w-9 h-9 inline-flex items-center justify-center text-[var(--color-charcoal-500)] hover:text-[var(--color-burgundy-700)] transition-colors"
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            </header>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <p className="text-eyebrow text-[var(--color-charcoal-500)] p-8">Loading commission…</p>
              ) : !order ? (
                <div className="p-8">
                  <Package size={20} className="text-[var(--color-burgundy-700)]" />
                  <p className="mt-3 text-[var(--color-charcoal-700)]">Commission not found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 p-6 lg:p-8">
                  {/* Left column: status update + message + items + history */}
                  <div className="space-y-8">
                    {/* Status update + message — the two write actions live together */}
                    <section className="border border-[var(--color-burgundy-700)]/25 bg-[var(--color-burgundy-50)] p-5 space-y-5">
                      <div>
                        <h3 className="text-eyebrow text-[var(--color-burgundy-700)]">Update status</h3>
                        <p className="text-[0.82rem] text-[var(--color-charcoal-700)] mt-1.5">
                          Sebastian delivers the change to the customer&rsquo;s notifications live.
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-3">
                          <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as OrderStatus)}
                            className="border border-black/15 bg-[var(--color-ivory-100)] px-3 py-2.5 text-[0.95rem] focus:outline-none focus:border-[var(--color-burgundy-700)]"
                          >
                            {ORDER_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {ORDER_STATUS_LABEL[s]}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={handleSaveStatus}
                            disabled={savingStatus || status === order.status}
                            className="text-eyebrow inline-flex items-center gap-2 bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] px-4 py-2.5 hover:bg-[var(--color-burgundy-800)] transition-colors disabled:opacity-50"
                          >
                            {savedStatus ? (
                              <>
                                <Check size={14} strokeWidth={1.5} /> Saved
                              </>
                            ) : (
                              <>
                                <Save size={14} strokeWidth={1.5} /> {savingStatus ? "Saving…" : "Update status"}
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="border-t border-[var(--color-burgundy-700)]/15 pt-5">
                        <h3 className="text-eyebrow text-[var(--color-burgundy-700)]">Message the customer</h3>
                        <p className="text-[0.82rem] text-[var(--color-charcoal-700)] mt-1.5">
                          Lands in their notifications and order timeline immediately, attributed to Sebastian.
                        </p>
                        <textarea
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          rows={3}
                          placeholder="e.g. Your first fitting is ready — Saturday 14:00 works for the atelier."
                          className="mt-3 w-full bg-[var(--color-ivory-100)] border border-black/15 px-3 py-2.5 text-[0.92rem] focus:outline-none focus:border-[var(--color-burgundy-700)]"
                        />
                        <div className="mt-3 flex items-center gap-3">
                          <button
                            type="button"
                            onClick={handleSendMessage}
                            disabled={sendingMessage || !message.trim()}
                            className="text-eyebrow inline-flex items-center gap-2 bg-[var(--color-charcoal-900)] text-[var(--color-ivory-100)] px-4 py-2.5 hover:bg-[var(--color-burgundy-700)] transition-colors disabled:opacity-50"
                          >
                            {sentMessage ? (
                              <>
                                <Check size={14} strokeWidth={1.5} /> Sent
                              </>
                            ) : (
                              <>
                                <Send size={14} strokeWidth={1.5} /> {sendingMessage ? "Sending…" : "Send to customer"}
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {error && (
                        <p className="text-[0.8rem] text-[var(--color-burgundy-700)] bg-[var(--color-ivory-100)] border border-[var(--color-burgundy-700)]/25 px-3 py-2">
                          {error}
                        </p>
                      )}
                    </section>

                    {/* Items */}
                    <section>
                      <h3 className="text-eyebrow text-[var(--color-charcoal-500)] mb-4">
                        Line items ({items.length})
                      </h3>
                      <ul className="border-y border-black/10 divide-y divide-black/10">
                        {items.map((it) => (
                          <li key={it.id} className="py-4 flex gap-4">
                            {it.image && (
                              <div className="relative shrink-0 w-16 h-16 bg-[var(--color-ivory-200)] overflow-hidden">
                                <Image src={it.image} alt={it.name} fill sizes="64px" className="object-cover" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <span className="text-eyebrow text-[var(--color-charcoal-500)] text-[0.6rem]">
                                {it.type_label}
                              </span>
                              <p className="text-display text-[1rem] mt-0.5 leading-tight">{it.name}</p>
                              <p className="text-[0.74rem] text-[var(--color-charcoal-500)] mt-1">
                                {it.item_type === "commission" ? "Custom commission" : "Stock item"} · SKU {it.sku} · qty{" "}
                                {it.qty}
                              </p>
                              {it.item_type === "commission" && Object.keys(it.custom).length > 0 && (
                                <details className="mt-2 text-[0.78rem]">
                                  <summary className="cursor-pointer text-[var(--color-burgundy-700)]">View spec</summary>
                                  <pre className="mt-2 bg-[var(--color-ivory-200)] p-3 overflow-x-auto text-[0.7rem]">
                                    {JSON.stringify(it.custom, null, 2)}
                                  </pre>
                                </details>
                              )}
                            </div>
                            <span className="text-[0.9rem] text-[var(--color-charcoal-900)] tabular-nums whitespace-nowrap">
                              {fmt(Number(it.price_num) * it.qty)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </section>

                    {/* Status + message history (this is what the customer sees) */}
                    <section>
                      <h3 className="text-eyebrow text-[var(--color-charcoal-500)] mb-4">
                        Timeline ({history.length})
                      </h3>
                      <ul className="border border-black/10 divide-y divide-black/10">
                        {history.map((h) => (
                          <li key={h.id} className="p-3 text-[0.88rem] flex justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-[var(--color-charcoal-900)]">
                                {ORDER_STATUS_LABEL[h.status]}
                              </div>
                              {h.note && (
                                <div className="text-[0.78rem] text-[var(--color-charcoal-500)] mt-0.5 leading-relaxed">
                                  {h.note}
                                </div>
                              )}
                            </div>
                            <span className="text-[0.76rem] text-[var(--color-charcoal-500)] tabular-nums whitespace-nowrap">
                              {new Date(h.changed_at).toLocaleString("en-GB", {
                                day: "numeric",
                                month: "short",
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  </div>

                  {/* Right column: customer + shipping + total */}
                  <aside className="space-y-5 self-start">
                    <div className="border border-black/10 p-5 bg-[var(--color-ivory-200)]">
                      <h3 className="text-eyebrow text-[var(--color-charcoal-500)]">Customer</h3>
                      <p className="text-display text-[1.05rem] mt-2">{order.customer_name || "—"}</p>
                      <p className="text-[0.82rem] text-[var(--color-charcoal-700)] mt-1 break-all">
                        {order.customer_email}
                      </p>
                      <p className="text-[0.82rem] text-[var(--color-charcoal-700)] tabular-nums">
                        {order.customer_phone || "—"}
                      </p>
                    </div>
                    <div className="border border-black/10 p-5">
                      <h3 className="text-eyebrow text-[var(--color-charcoal-500)]">Shipping</h3>
                      <p className="mt-2 text-[0.88rem] text-[var(--color-charcoal-900)] leading-relaxed">
                        {order.shipping_address.line1}
                        <br />
                        {order.shipping_address.line2 && (
                          <>
                            {order.shipping_address.line2}
                            <br />
                          </>
                        )}
                        {order.shipping_address.city}, {order.shipping_address.country}
                      </p>
                    </div>
                    <div className="border border-black/10 p-5">
                      <h3 className="text-eyebrow text-[var(--color-charcoal-500)]">Total</h3>
                      <p className="text-display text-[1.5rem] mt-2 text-[var(--color-burgundy-700)] tabular-nums">
                        {fmt(Number(order.subtotal))}
                      </p>
                    </div>
                  </aside>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
