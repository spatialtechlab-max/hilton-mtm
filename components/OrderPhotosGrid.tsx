"use client";

import { useEffect, useState } from "react";
import { Camera } from "lucide-react";
import {
  listOrderPhotos,
  signedUrlFor,
  ORDER_VIEWS,
  ORDER_VIEW_LABEL,
  type OrderMediaRow,
  type OrderView,
} from "@/lib/orderMedia";

/**
 * Renders the four body-photo slots for an order. Slots without a photo
 * show a discreet "Not provided" placeholder. Slots with a photo render
 * a signed URL (the bucket is private), so the URL refreshes if the
 * customer revisits the page after the 10-minute expiry.
 *
 * Used by both /account/orders/<#> (the customer's own view) and
 * /admin/orders/<#> (atelier view). RLS handles the access boundary
 * — customers see only their own; admins see everyone.
 */
export function OrderPhotosGrid({ orderId, audience }: { orderId: string; audience: "customer" | "admin" }) {
  const [photos, setPhotos] = useState<OrderMediaRow[]>([]);
  const [urls, setUrls]     = useState<Record<OrderView, string | null>>({
    front: null, back: null, left: null, right: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const rows = await listOrderPhotos(orderId);
      if (cancelled) return;
      setPhotos(rows);
      // Resolve a signed URL per row in parallel.
      const pairs = await Promise.all(
        rows.map(async (r) => [r.view, await signedUrlFor(r.storage_path)] as const),
      );
      if (cancelled) return;
      const next: Record<OrderView, string | null> = { front: null, back: null, left: null, right: null };
      for (const [view, url] of pairs) next[view] = url;
      setUrls(next);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [orderId]);

  // If the customer didn't upload anything AND we're on the customer
  // surface, hide the section entirely — no need to scold them for
  // skipping an optional step. On the admin side we still show the
  // empty placeholders so the atelier knows nothing was provided.
  const hasAny = photos.length > 0;
  if (!loading && !hasAny && audience === "customer") return null;

  return (
    <section className="mt-10">
      <h2 className="text-eyebrow text-[var(--color-charcoal-500)] mb-5 inline-flex items-center gap-2">
        <Camera size={14} strokeWidth={1.5} /> Body photographs
      </h2>
      {loading ? (
        <p className="text-eyebrow text-[var(--color-charcoal-500)]">Loading…</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {ORDER_VIEWS.map((view) => {
            const url = urls[view];
            return (
              <div key={view} className="block">
                <div className="relative aspect-[3/4] border border-black/10 bg-[var(--color-ivory-200)] overflow-hidden">
                  {url ? (
                    <a href={url} target="_blank" rel="noopener noreferrer" className="absolute inset-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={ORDER_VIEW_LABEL[view]} className="absolute inset-0 w-full h-full object-cover" />
                    </a>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-[var(--color-charcoal-500)] text-[0.72rem] italic">
                      Not provided
                    </div>
                  )}
                </div>
                <div className="text-eyebrow text-[0.6rem] text-[var(--color-charcoal-700)] mt-2">
                  {ORDER_VIEW_LABEL[view]}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
