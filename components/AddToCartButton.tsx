"use client";

import { useState } from "react";
import { ShoppingBag, Check } from "lucide-react";
import { addToCart, type CartItem } from "@/lib/cart";

/**
 * Adds the current product to the persistent cart (lib/cart.ts) and gives a
 * brief visual confirmation. The nav's cart-count badge updates automatically
 * via the cart-changed event.
 */
export function AddToCartButton({
  label = "Add to cart",
  variant = "solid",
  product,
}: {
  label?: string;
  variant?: "solid" | "outline";
  /** Product info to add to the cart. Pass omit `qty/id` — those are generated. */
  product?: Omit<CartItem, "id" | "qty"> & { qty?: number };
}) {
  const [added, setAdded] = useState(false);

  const base =
    "w-full text-eyebrow inline-flex items-center justify-center gap-3 px-8 py-4 transition-colors";
  const styles =
    variant === "solid"
      ? "bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] hover:bg-[var(--color-burgundy-800)]"
      : "border border-[var(--color-burgundy-700)] text-[var(--color-burgundy-700)] hover:bg-[var(--color-burgundy-700)] hover:text-[var(--color-ivory-100)]";

  return (
    <button
      type="button"
      onClick={() => {
        if (product) addToCart(product);
        setAdded(true);
        window.setTimeout(() => setAdded(false), 2200);
      }}
      className={`${base} ${styles}`}
    >
      {added ? (
        <><Check size={16} strokeWidth={1.5} /> Added to cart</>
      ) : (
        <><ShoppingBag size={16} strokeWidth={1.5} /> {label}</>
      )}
    </button>
  );
}
