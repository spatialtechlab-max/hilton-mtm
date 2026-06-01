"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Package, MessageCircle, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthProvider";
import { ORDER_STATUS_LABEL, listMyOrders, type Order } from "@/lib/orders";

/**
 * Bell + dropdown.
 *
 * Anonymous visitors see a short welcome strip (so the bell isn't empty).
 * Signed-in customers see their own orders, with a Supabase Realtime
 * subscription on `mtm_orders` so admin status changes appear here without
 * a refresh — this is the channel the user calls out in the brief.
 */

type N = {
  id: string;
  icon: "package" | "chat" | "sparkle";
  title: string;
  body?: string;
  href?: string;
  ts: number;
  unread: boolean;
};

const ANON_NOTES: N[] = [
  {
    id: "anon-welcome",
    icon: "sparkle",
    title: "Welcome to Hilton MTM",
    body: "Sebastian can guide you through cloth and cut — tap the concierge at the bottom right.",
    ts: Date.now() - 60 * 1000,
    unread: true,
  },
  {
    id: "anon-visit",
    icon: "package",
    title: "The atelier is open",
    body: "Shop No. 119, Shaikh Abdulla Avenue, Manama. Sun–Thu, by appointment.",
    href: "/book",
    ts: Date.now() - 5 * 60 * 1000,
    unread: false,
  },
];

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

function orderToNotification(o: Order): N {
  return {
    id: `order-${o.id}-${o.updated_at}`,
    icon: "package",
    title: `${o.order_number} — ${ORDER_STATUS_LABEL[o.status]}`,
    body: `Updated ${new Date(o.updated_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`,
    href: `/account/orders/${o.order_number}`,
    ts: new Date(o.updated_at).getTime(),
    unread: true,
  };
}

export function NotificationBell({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState<N[]>(ANON_NOTES);
  const [readSet, setReadSet] = useState<Set<string>>(() => new Set());
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Re-hydrate the read-state map only on the client (avoids hydration mismatch).
  useEffect(() => {
    setReadSet(readReadSet());
  }, []);

  // Hydrate signed-in customer's order list, then subscribe to live updates.
  useEffect(() => {
    if (!user) {
      setNotes(ANON_NOTES);
      return;
    }
    let cancelled = false;
    (async () => {
      const orders = await listMyOrders();
      if (cancelled) return;
      setNotes(orders.slice(0, 8).map(orderToNotification));
    })();

    const channel = supabase
      .channel(`bell-orders-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "mtm_orders", filter: `user_id=eq.${user.id}` },
        async () => {
          const fresh = await listMyOrders();
          setNotes(fresh.slice(0, 8).map(orderToNotification));
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user]);

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
            <header className="px-4 py-3 border-b border-black/10 flex items-center justify-between">
              <div>
                <div className="text-eyebrow text-[var(--color-burgundy-700)] text-[0.6rem]">
                  From the atelier
                </div>
                <div className="text-display text-[1.05rem] text-[var(--color-charcoal-900)] leading-none mt-1">
                  Notifications
                </div>
              </div>
              {user ? null : (
                <Link
                  href="/account"
                  className="text-eyebrow text-[0.6rem] text-[var(--color-charcoal-500)] hover:text-[var(--color-burgundy-700)] transition-colors"
                  onClick={() => setOpen(false)}
                >
                  Sign in
                </Link>
              )}
            </header>
            <ul className="max-h-[60vh] overflow-y-auto divide-y divide-black/5">
              {notes.length === 0 ? (
                <li className="px-4 py-6 text-[0.85rem] text-[var(--color-charcoal-500)]">
                  No commissions yet. Begin one and you'll see updates here.
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
                  href="/account"
                  onClick={() => setOpen(false)}
                  className="text-eyebrow text-[0.62rem] text-[var(--color-burgundy-700)] hover:underline"
                >
                  See all commissions →
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
  const Icon = note.icon === "package" ? Package : note.icon === "chat" ? MessageCircle : Sparkles;
  const body = (
    <div className="px-4 py-3 flex items-start gap-3 hover:bg-[var(--color-ivory-200)] transition-colors">
      <span className="mt-0.5 w-8 h-8 rounded-full bg-[var(--color-ivory-200)] text-[var(--color-burgundy-700)] inline-flex items-center justify-center shrink-0">
        <Icon size={14} strokeWidth={1.5} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[0.88rem] text-[var(--color-charcoal-900)] truncate">{note.title}</div>
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
