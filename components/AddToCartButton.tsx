"use client";

import { useState } from "react";
import { ShoppingBag, Check } from "lucide-react";

/**
 * Frontend-only add-to-cart for now — gives visual confirmation. A real cart
 * store + persistence lands with the backend work.
 */
export function AddToCartButton({
  label = "Add to cart",
  variant = "solid",
}: {
  label?: string;
  variant?: "solid" | "outline";
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
