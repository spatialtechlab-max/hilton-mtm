"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthProvider";
import { isAdmin } from "@/lib/admin";
import { ORDER_STATUS_LABEL, listMyOrders, listAllOrders, type Order, type OrderStatus } from "@/lib/orders";

/**
 * Bell + dropdown — only meaningful for signed-in customers.
 *
 * The bell stays visible to everyone for layout consistency, but it only
 * fills with content when the visitor is signed in. Each notification is
 * written in Sebastian's voice — the same agent runs the chat AND watches
 * for status changes from the atelier, so the visitor feels one continuous
 * concierge presence across the site.
 */

type N = {
  id: string;
  title: string;
  body?: string;
  href?: string;
  ts: number;
  unread: boolean;
};

const READ_KEY = "hilton-notif-read";

function readReadSet(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(READ_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function writeReadSet(s: Set<string>) {
  try {
    localStorage.setItem(READ_KEY, JSON.stringify(Array.from(s)));
  } catch {
    /* ignore */
  }
}

// Status-specific phrasing in Sebastian's voice. We avoid robotic phrases
// like "Status changed" and lean into the concierge framing the user asked
// for ("Sebastian noticed your commission has moved forward").
const SEBASTIAN_LINE: Record<OrderStatus, string> = {
  placed:           "I've placed your commission with the cutter.",
  confirmed:        "The atelier has confirmed your commission.",
  cloth_received:   "Your cloth has arrived from the mill.",
  cutting:          "Your commission is on the cutting bench.",
  in_production:    "Your commission has moved into production.",
  fitting_ready:    "Your fitting is ready when you are.",
  finishing:        "We are at the finishing stage — almost there.",
  ready_for_pickup: "Your commission is ready for pickup at the atelier.",
  delivered:        "Your commission has been delivered. A pleasure to dress you.",
  cancelled:        "Your commission has been cancelled.",
};

// Customer-facing: the visitor cares about their OWN order's status, in
// concierge voice. Click lands on the customer-side order detail page.
function customerOrderToNotification(o: Order): N {
  return {
    id: `order-${o.id}-${o.updated_at}`,
    title: `${o.order_number} · ${ORDER_STATUS_LABEL[o.status]}`,
    body: `${SEBASTIAN_LINE[o.status]} — ${new Date(o.updated_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`,
    href: `/account/orders/${o.order_number}`,
    ts: new Date(o.updated_at).getTime(),
    unread: true,
  };
}

// Admin-facing: operational. Sebastian flags any new commission and any
// status change across the whole atelier. Click jumps into the admin
// list (the modal opens from there).
function adminOrderToNotification(o: Order): N {
  const fresh = Math.abs(new Date(o.created_at).getTime() - new Date(o.updated_at).getTime()) < 5_000;
  const body = fresh
    ? `A new commission has come in from ${o.customer_name || o.customer_email}.`
    : `Status now ${ORDER_STATUS_LABEL[o.status]}. Customer: ${o.customer_name || o.customer_email}.`;
  return {
    id: `admin-${o.id}-${o.updated_at}`,
    title: `${o.order_number} · ${ORDER_STATUS_LABEL[o.status]}`,
    body: `${body} — ${new Date(o.updated_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`,
    href: `/admin/orders`,
    ts: new Date(o.updated_at).getTime(),
    unread: true,
  };
}

export function NotificationBell({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const { user } = useAuth();
  const [admin, setAdmin] = useState<boolean | null>(null);
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState<N[]>([]);
  const [readSet, setReadSet] = useState<Set<string>>(() => new Set());
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Re-hydrate the read-state map only on the client (avoids hydration mismatch).
  useEffect(() => {
    setReadSet(readReadSet());
  }, []);

  // Resolve admin once per signed-in user — the bell content branches on this.
  useEffect(() => {
    if (!user) { setAdmin(null); return; }
    isAdmin(user.email).then(setAdmin);
  }, [user]);

  // Hydrate the bell. Branches by role:
  //   anon     → empty
  //   customer → my orders + atelier messages addressed to me
  //   admin    → ALL orders across the atelier in operational language
  useEffect(() => {
    if (!user || admin === null) {
      if (!user) setNotes([]);
      return;
    }
    let cancelled = false;

    async function refresh() {
      if (admin) {
        const all = await listAllOrders();
        if (!cancelled) setNotes(all.slice(0, 10).map(adminOrderToNotification));
      } else {
        const mine = await listMyOrders();
        if (!cancelled) setNotes(mine.slice(0, 10).map(customerOrderToNotification));
      }
    }
    void refresh();

    // Admin subscribes to ALL orders; customer only to their own. Both also
    // listen to status_history so admin-sent messages land instantly.
    const orderFilter = admin ? undefined : `user_id=eq.${user.id}`;
    const channel = supabase
      .channel(`bell-${admin ? "admin" : "user"}-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "mtm_orders", ...(orderFilter ? { filter: orderFilter } : {}) },
        () => void refresh(),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "mtm_order_status_history" },
        () => void refresh(),
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user, admin]);

  // Close on outside-click / Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const markAllRead = useCallback(() => {
    const updated = new Set(readSet);
    notes.forEach((n) => updated.add(n.id));
    setReadSet(updated);
    writeReadSet(updated);
  }, [readSet, notes]);

  // When the panel opens, treat everything currently visible as read.
  useEffect(() => {
    if (open) markAllRead();
  }, [open, markAllRead]);

  const unreadCount = notes.filter((n) => n.unread && !readSet.has(n.id)).length;

  const buttonTone =
    tone === "light"
      ? "text-[var(--color-ivory-100)]/85 hover:text-[var(--color-ivory-100)]"
      : "text-[var(--color-charcoal-800)] hover:text-[var(--color-burgundy-700)]";

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications, ${unreadCount} unread`}
        aria-expanded={open}
        className={`relative inline-flex items-center justify-center w-10 h-10 transition-colors ${buttonTone}`}
      >
        <Bell size={20} strokeWidth={1.5} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center text-[0.6rem] font-medium bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 w-[min(92vw,360px)] bg-[var(--color-ivory-100)] border border-black/10 shadow-2xl shadow-black/15 z-[60]"
            role="dialog"
            aria-label="Notifications"
          >
            <header className="px-4 py-3 border-b border-black/10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-7 h-7 rounded-full bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] inline-flex items-center justify-center shrink-0">
                  <Sparkles size={12} strokeWidth={1.6} />
                </span>
                <div className="min-w-0">
                  <div className="text-eyebrow text-[var(--color-burgundy-700)] text-[0.58rem]">
                    {admin ? "Sebastian · Atelier desk" : "From Sebastian"}
                  </div>
                  <div className="text-display text-[1.0rem] text-[var(--color-charcoal-900)] leading-none mt-0.5">
                    {admin ? "Activity" : "Notifications"}
                  </div>
                </div>
              </div>
              {user ? null : (
                <Link
                  href="/account"
                  className="text-eyebrow text-[0.6rem] text-[var(--color-charcoal-500)] hover:text-[var(--color-burgundy-700)] transition-colors shrink-0"
                  onClick={() => setOpen(false)}
                >
                  Sign in
                </Link>
              )}
            </header>
            <ul className="max-h-[60vh] overflow-y-auto divide-y divide-black/5">
              {!user ? (
                <li className="px-4 py-6 text-[0.85rem] text-[var(--color-charcoal-700)] leading-relaxed">
                  Sign in and I'll keep you informed as your commission moves
                  through the atelier — first cut, fitting, finishing,
                  delivery.
                </li>
              ) : notes.length === 0 ? (
                <li className="px-4 py-6 text-[0.85rem] text-[var(--color-charcoal-500)]">
                  {admin
                    ? "The atelier desk is quiet. New commissions and status changes will appear here."
                    : "No commissions yet. Begin one and I'll update you here."}
                </li>
              ) : (
                notes.map((n) => (
                  <li key={n.id}>
                    <NoteRow note={n} onClose={() => setOpen(false)} />
                  </li>
                ))
              )}
            </ul>
            {user && (
              <footer className="px-4 py-3 border-t border-black/10">
                <Link
                  href={admin ? "/admin/orders" : "/account"}
                  onClick={() => setOpen(false)}
                  className="text-eyebrow text-[0.62rem] text-[var(--color-burgundy-700)] hover:underline"
                >
                  {admin ? "Open the atelier desk →" : "See all commissions →"}
                </Link>
              </footer>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NoteRow({ note, onClose }: { note: N; onClose: () => void }) {
  const body = (
    <div className="px-4 py-3 flex items-start gap-3 hover:bg-[var(--color-ivory-200)] transition-colors">
      <span className="mt-0.5 w-8 h-8 rounded-full bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] inline-flex items-center justify-center shrink-0">
        <Sparkles size={12} strokeWidth={1.6} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[0.86rem] text-[var(--color-charcoal-900)] tabular-nums">{note.title}</div>
        {note.body && (
          <div className="text-[0.78rem] text-[var(--color-charcoal-500)] mt-0.5 line-clamp-2">{note.body}</div>
        )}
      </div>
    </div>
  );
  return note.href ? (
    <Link href={note.href} onClick={onClose}>
      {body}
    </Link>
  ) : (
    body
  );
}
