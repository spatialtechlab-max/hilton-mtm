"use client";

import { useEffect, useState } from "react";

/**
 * Minimal cart store backed by localStorage. Items persist across reloads
 * and across browser sessions until checkout (or until cleared). The cart
 * icon in the nav listens to a `hilton-cart-changed` event so the count
 * stays in sync everywhere on the page.
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

const KEY = "hilton-cart";
const EVT = "hilton-cart-changed";

function read(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function write(items: CartItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
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
