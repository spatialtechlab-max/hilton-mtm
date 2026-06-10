"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthProvider";
import { isAdmin } from "@/lib/admin";
import { ORDER_STATUS_LABEL, listMyOrders, listAllOrders, fetchRecentMessages, type Order, type OrderStatus, type RecentMessage } from "@/lib/orders";

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
  finishing:        "We are at the finishing stage. Almost there.",
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
    body: `${SEBASTIAN_LINE[o.status]} · ${new Date(o.updated_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`,
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
    body: `${body} · ${new Date(o.updated_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`,
    href: `/admin/orders`,
    ts: new Date(o.updated_at).getTime(),
    unread: true,
  };
}

// Custom message a human in the atelier (admin) wrote inside the order
// modal. Surfaces on BOTH bells — customer sees "Sebastian's note", admin
// sees "Sent to <customer>". Routes the click to the right detail surface.
function messageToCustomerNotification(m: RecentMessage): N {
  return {
    id: `msg-${m.id}`,
    title: `${m.order_number} · Note from the atelier`,
    body: `${m.note} · ${new Date(m.changed_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`,
    href: `/account/orders/${m.order_number}`,
    ts: new Date(m.changed_at).getTime(),
    unread: true,
  };
}

function messageToAdminNotification(m: RecentMessage): N {
  return {
    id: `admin-msg-${m.id}`,
    title: `${m.order_number} · Sent to ${m.customer_name || "customer"}`,
    body: `${m.note} · ${new Date(m.changed_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`,
    href: `/admin/orders`,
    ts: new Date(m.changed_at).getTime(),
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
        const [all, msgs] = await Promise.all([listAllOrders(), fetchRecentMessages(15)]);
        if (cancelled) return;
        const merged: N[] = [
          ...all.slice(0, 10).map(adminOrderToNotification),
          ...msgs.map(messageToAdminNotification),
        ].sort((a, b) => b.ts - a.ts).slice(0, 15);
        setNotes(merged);
      } else {
        const [mine, msgs] = await Promise.all([listMyOrders(), fetchRecentMessages(15)]);
        if (cancelled) return;
        // RLS already scopes fetchRecentMessages to the customer's own
        // orders, so msgs is safe to merge as-is.
        const merged: N[] = [
          ...mine.slice(0, 10).map(customerOrderToNotification),
          ...msgs.map(messageToCustomerNotification),
        ].sort((a, b) => b.ts - a.ts).slice(0, 15);
        setNotes(merged);
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
            className="absolute right-0 top-full mt-2 w-[min(92vw,380px)] bg-[var(--color-ivory-100)] border border-black/8 shadow-[0_18px_50px_-18px_rgba(0,0,0,0.32)] z-[60] overflow-hidden"
            role="dialog"
            aria-label="Notifications"
          >
            {/* Concierge correspondence card — ivory paper, centered
                brand monogram, generous whitespace. Reads like a
                personal note from the atelier rather than a system
                notification feed. */}
            <header className="relative px-7 pt-7 pb-6 text-center">
              {/* Hairline top accent rule, burgundy, very thin */}
              <span
                aria-hidden
                className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-px bg-[var(--color-burgundy-700)]"
              />
              {/* The house mark, small and dignified */}
              <Image
                src="/logo-burgundy.png"
                alt=""
                width={108}
                height={91}
                priority
                className="mx-auto h-9 w-auto object-contain opacity-95 select-none"
                draggable={false}
              />
              {/* Eyebrow — small caps, generously spaced */}
              <div className="mt-5 text-[0.55rem] uppercase tracking-[0.42em] text-[var(--color-charcoal-500)]">
                {admin ? "From the Atelier Desk" : "From the Concierge"}
              </div>
              {/* Sebastian, in display serif at a real luxury weight */}
              <div className="mt-3 text-display text-[1.75rem] text-[var(--color-charcoal-900)] leading-none">
                Sebastian
              </div>
              {/* Italic burgundy subtitle — the personal touch */}
              <div className="mt-2.5 text-[0.78rem] text-[var(--color-burgundy-700)] italic">
                {admin ? "Notes from the floor" : "Notes for you"}
              </div>
              {!user && (
                <div className="mt-5">
                  <Link
                    href="/account"
                    onClick={() => setOpen(false)}
                    className="inline-block text-eyebrow text-[0.58rem] text-[var(--color-burgundy-700)] border-b border-[var(--color-burgundy-700)]/40 pb-0.5 hover:border-[var(--color-burgundy-700)] transition-colors"
                  >
                    Sign in
                  </Link>
                </div>
              )}
              {/* Bottom rule — narrow, centered, ornament-style */}
              <div className="mt-6 flex items-center justify-center gap-3 text-[var(--color-burgundy-700)]/30">
                <span className="h-px w-12 bg-current" />
                <span className="text-[0.5rem] tracking-[0.3em] text-[var(--color-charcoal-500)] uppercase">
                  {admin ? "Activity" : "Updates"}
                </span>
                <span className="h-px w-12 bg-current" />
              </div>
            </header>
            <ul className="max-h-[60vh] overflow-y-auto divide-y divide-black/[0.06]">
              {!user ? (
                <li className="px-7 py-7 text-[0.82rem] text-[var(--color-charcoal-700)] leading-relaxed italic text-center">
                  Sign in and I will keep you informed as your commission
                  moves through the atelier — first cut, fitting, finishing,
                  delivery.
                </li>
              ) : notes.length === 0 ? (
                <li className="px-7 py-7 text-[0.82rem] text-[var(--color-charcoal-500)] italic text-center">
                  {admin
                    ? "The atelier desk is quiet for the moment."
                    : "No commissions yet. Begin one and I will write to you here."}
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
              <footer className="border-t border-black/[0.07] px-7 py-4 text-center">
                <Link
                  href={admin ? "/admin/orders" : "/account"}
                  onClick={() => setOpen(false)}
                  className="text-[0.7rem] italic text-[var(--color-burgundy-700)] inline-flex items-center gap-2 hover:gap-3 transition-all"
                >
                  {admin ? "Open the atelier desk" : "See all of your commissions"}
                  <span aria-hidden className="text-[0.8em]">→</span>
                </Link>
              </footer>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Split the bell note's compound title into "HMTM-2026-0005" + the
 *  status / subtitle that follows the middle dot. Falls back gracefully
 *  for messages that don't follow that format. */
function splitTitle(title: string): { lead: string; tail: string } {
  const i = title.indexOf("·");
  if (i < 0) return { lead: title.trim(), tail: "" };
  return {
    lead: title.slice(0, i).trim(),
    tail: title.slice(i + 1).trim(),
  };
}

/** Pull the trailing "· 10 Jun, 14:24" timestamp from the bell body so we
 *  can right-align it editorially instead of dragging it through the
 *  prose. Returns the stripped body + the extracted stamp. */
function splitBody(body: string | undefined): { prose: string; stamp: string } {
  if (!body) return { prose: "", stamp: "" };
  const m = body.match(/\s*·\s*([^·]+)$/);
  if (!m) return { prose: body, stamp: "" };
  return { prose: body.slice(0, m.index).trim(), stamp: m[1].trim() };
}

function NoteRow({ note, onClose }: { note: N; onClose: () => void }) {
  const { lead, tail } = splitTitle(note.title);
  const { prose, stamp } = splitBody(note.body);
  const body = (
    <div className="group relative px-7 py-4 hover:bg-[var(--color-ivory-200)]/45 transition-colors">
      {/* Discreet diamond ornament aligned with the headline baseline */}
      <span
        aria-hidden
        className="absolute left-4 top-[1.45rem] w-[5px] h-[5px] bg-[var(--color-burgundy-700)] rotate-45 opacity-70 group-hover:opacity-100 transition-opacity"
      />
      <div className="flex items-baseline justify-between gap-3">
        <div className="min-w-0 flex-1 text-display text-[0.95rem] text-[var(--color-charcoal-900)] tabular-nums leading-tight truncate group-hover:text-[var(--color-burgundy-700)] transition-colors">
          {lead}
        </div>
        {stamp && (
          <span className="shrink-0 text-[0.68rem] text-[var(--color-charcoal-500)] italic tabular-nums">
            {stamp}
          </span>
        )}
      </div>
      {tail && (
        <div className="mt-1 text-[0.62rem] uppercase tracking-[0.28em] text-[var(--color-burgundy-700)]/85">
          {tail}
        </div>
      )}
      {prose && (
        <p className="mt-2 text-[0.8rem] text-[var(--color-charcoal-700)] leading-relaxed line-clamp-2">
          {prose}
        </p>
      )}
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
