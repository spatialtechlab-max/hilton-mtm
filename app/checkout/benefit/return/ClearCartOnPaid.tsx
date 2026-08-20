"use client";

import { useEffect } from "react";
import { clearCart } from "@/lib/cart";

/**
 * Empty the bag once a BENEFIT payment has been confirmed paid.
 *
 * The cart lives in localStorage, so only the browser can clear it, and the
 * return page itself is a server component (it reads the order straight from
 * the database rather than trusting the redirect). This is the small client
 * piece that does the clearing.
 *
 * Caught in testing: without it the customer paid, landed on "your commission
 * is confirmed", and still had the item sitting in their bag with the header
 * badge showing 1. The MPGS return page has always called clearCart(); this
 * gives the second rail the same behaviour.
 *
 * Deliberately keyed off the SERVER's verdict, not the `state` query parameter,
 * so a customer who edits the URL cannot empty their own cart without paying.
 */
export default function ClearCartOnPaid({ paid }: { paid: boolean }) {
  useEffect(() => {
    if (paid) clearCart();
  }, [paid]);
  return null;
}
