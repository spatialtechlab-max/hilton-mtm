"use client";

import Image from "next/image";
import { useState } from "react";
import { PlaceholderBadge, isPlaceholder } from "./PlaceholderBadge";

/**
 * Amazon-style product gallery: a large main image with a thumbnail strip.
 * `contain` is for transparent product photos (shoes/ties) that sit in a
 * cream display case; otherwise the image fills the frame (object-cover).
 */
export function ProductGallery({
  images, alt, contain,
}: {
  images: string[];
  alt: string;
  contain: boolean;
}) {
  const [active, setActive] = useState(0);
  const main = images[active] ?? images[0];

  return (
    <div>
      <div className={`relative aspect-[4/5] overflow-hidden ${contain ? "bg-[var(--color-ivory-200)]" : "grain"}`}>
        {main && isPlaceholder(main) && <PlaceholderBadge />}
        {main && (
          <Image
            src={main}
            alt={alt}
            fill
            sizes="(min-width: 1024px) 48vw, 100vw"
            className={contain ? "object-contain p-8 md:p-12" : "object-cover"}
            priority
          />
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-4 grid grid-cols-4 gap-3">
          {images.map((src, i) => {
            const isActive = i === active;
            return (
              <button
                key={`${src}-${i}`}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`View image ${i + 1}`}
                className={`relative aspect-square overflow-hidden border transition-colors ${
                  isActive
                    ? "border-[var(--color-burgundy-700)]"
                    : "border-black/10 hover:border-[var(--color-burgundy-700)]/40"
                } ${contain ? "bg-[var(--color-ivory-200)]" : ""}`}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="20vw"
                  className={contain ? "object-contain p-2" : "object-cover"}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
