"use client";

import { useEffect, useState } from "react";

/**
 * Cart store backed by localStorage, scoped PER USER.
 *
 * Why per-user: a single shared cart key leaks one customer's bag to the
 * next person who signs in on the same browser. Instead every signed-in
 * customer gets their own key (`hilton-cart:u:<id>`), and there's a
 * separate guest bag (`hilton-cart:guest`) for browsing before sign-in.
 *
 * Rules (driven by AuthProvider calling setCartUser on every auth change):
 *   • Sign in  → the guest bag merges into the customer's bag, then the
 *                guest bag is emptied. A returning customer sees their own
 *                stored bag; a brand-new account starts empty.
 *   • Sign out → we switch back to the (empty) guest bag and wipe guest
 *                leftovers. The customer's own bag is preserved under their
 *                key for next time, and is never visible to anyone else.
 *
 * The cart icon listens to `hilton-cart-changed`; cross-tab updates come
 * through the native `storage` event.
 */

export type CartItem = {
  id: string;          // unique cart line id
  sku: string;
  name: string;
  type: string;        // e.g. "Whole-Cut Oxford"
  price: string;       // e.g. "BHD 1,000"
  priceNum: number;    // numeric for totals
  image: string;
  contain?: boolean;   // true for transparent product photos (display case)
  href: string;        // link back to the PDP
  qty: number;
  // For customised commissions only:
  custom?: {
    category: string;          // "suit" | "jacket" | "shirt" | "trouser"
    tier?: string;             // e.g. "signature"
    fabric?: string;           // selected fabric name
    fabricSku?: string;        // ERP SKU so the Edit deep-link can rehydrate the fabric pick
    selections?: Record<string, string>;
    surcharge?: number;        // total surcharge BHD
  };
};

const BASE = "hilton-cart";
const LEGACY = "hilton-cart";          // the old single shared key (pre per-user)
const GUEST_KEY = `${BASE}:guest`;
const EVT = "hilton-cart-changed";

// Whose cart is active right now. null = guest. Set by AuthProvider via
// setCartUser as soon as the session resolves.
let activeUserId: string | null = null;
let legacyCleared = false;

const keyFor = (userId: string | null) => (userId ? `${BASE}:u:${userId}` : GUEST_KEY);

function readKey(key: string): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function writeKey(key: string, items: CartItem[]) {
  localStorage.setItem(key, JSON.stringify(items));
}

function read(): CartItem[] {
  return readKey(keyFor(activeUserId));
}

function write(items: CartItem[]) {
  if (typeof window === "undefined") return;
  writeKey(keyFor(activeUserId), items);
  window.dispatchEvent(new Event(EVT));
}

/** Combine two bags: non-custom lines dedupe by SKU (summing qty); custom
 *  commissions are always kept as distinct lines. Ids are kept unique. */
function mergeCarts(into: CartItem[], extra: CartItem[]): CartItem[] {
  const result = into.map((i) => ({ ...i }));
  const usedIds = new Set(result.map((i) => i.id));
  for (const item of extra) {
    if (!item.custom) {
      const existing = result.find((i) => i.sku === item.sku && !i.custom);
      if (existing) { existing.qty += item.qty; continue; }
    }
    let id = item.id;
    while (usedIds.has(id)) id = `${item.sku}-${Math.floor(Math.random() * 1e9)}`;
    usedIds.add(id);
    result.push({ ...item, id });
  }
  return result;
}

/**
 * Tell the cart who is signed in. Called by AuthProvider on every auth
 * state change (and once the initial session resolves).
 */
export function setCartUser(userId: string | null) {
  if (typeof window === "undefined") return;

  // One-time cleanup of the old shared key so a pre-existing global bag
  // can't bleed between accounts after this change ships.
  if (!legacyCleared) {
    legacyCleared = true;
    try { localStorage.removeItem(LEGACY); } catch { /* ignore */ }
  }

  if (activeUserId === userId) return;

  if (userId) {
    // Signing in (or switching accounts): fold the guest bag into this
    // customer's bag so anything added while browsing follows them in.
    const guest = readKey(GUEST_KEY);
    if (guest.length) {
      const mine = readKey(keyFor(userId));
      writeKey(keyFor(userId), mergeCarts(mine, guest));
    }
    localStorage.removeItem(GUEST_KEY);
    activeUserId = userId;
  } else {
    // Signing out: drop any guest leftovers and show the empty guest bag.
    // The previous user's bag stays under their own key, untouched.
    localStorage.removeItem(GUEST_KEY);
    activeUserId = null;
  }
  window.dispatchEvent(new Event(EVT));
}

export function addToCart(item: Omit<CartItem, "id" | "qty"> & { qty?: number }) {
  const items = read();
  // For non-custom items, bump quantity if the same SKU already exists.
  if (!item.custom) {
    const existing = items.find((i) => i.sku === item.sku && !i.custom);
    if (existing) {
      existing.qty += item.qty ?? 1;
      write(items);
      return existing.id;
    }
  }
  const id = `${item.sku}-${Date.now()}`;
  items.push({ ...item, id, qty: item.qty ?? 1 });
  write(items);
  return id;
}

export function removeFromCart(id: string) {
  write(read().filter((i) => i.id !== id));
}

export function updateQty(id: string, qty: number) {
  const items = read();
  const it = items.find((i) => i.id === id);
  if (it) {
    it.qty = Math.max(1, qty);
    write(items);
  }
}

export function clearCart() {
  write([]);
}

/** React hook — returns current cart + total, re-renders on changes. */
export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  useEffect(() => {
    setItems(read());
    const sync = () => setItems(read());
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  const subtotal = items.reduce((s, i) => s + i.priceNum * i.qty, 0);
  const count    = items.reduce((s, i) => s + i.qty, 0);
  return { items, subtotal, count };
}
