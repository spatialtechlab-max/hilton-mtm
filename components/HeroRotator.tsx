"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { HeroSlideRow } from "@/lib/heroSlidesServer";
import { listActiveHeroSlides } from "@/lib/heroSlides";

/**
 * Slide-left hero carousel. Advances every 4 s.
 *
 * The track contains every slide laid out side-by-side, plus a clone of
 * the first slide pinned at the end. Each tick translates the track by
 * one slide-width to the left. When the index hits the clone position
 * we snap back to 0 with the transition disabled, which produces a
 * seamless infinite loop without a visible jump.
 *
 * SSR primes the initial slide list (so the first paint isn't an empty
 * black box), but the component also re-fetches the list on mount. That
 * way newly uploaded slides take effect immediately without waiting for
 * the page's ISR cache (60 s) to expire.
 */
const INTERVAL_MS = 4000;
const TRANSITION_MS = 900;

export function HeroRotator({ slides, fallbackSrc, fallbackAlt }: {
  slides: HeroSlideRow[];
  fallbackSrc: string;
  fallbackAlt: string;
}) {
  const [list, setList] = useState<HeroSlideRow[]>(slides);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const fresh = await listActiveHeroSlides();
      if (cancelled) return;
      // If the SSR list and the live list disagree, prefer the live one.
      const ssrIds = slides.map((s) => s.id).join(",");
      const freshIds = fresh.map((s) => s.id).join(",");
      if (ssrIds !== freshIds) {
        setList(fresh.map((s) => ({
          id: s.id, image_url: s.image_url, alt: s.alt,
          position: s.position, active: s.active,
        })));
      }
    })();
    return () => { cancelled = true; };
    // We intentionally only run this once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const effective = list.length > 0
    ? list
    : [{ id: "fallback", image_url: fallbackSrc, alt: fallbackAlt, position: 0, active: true } as HeroSlideRow];

  const N = effective.length;
  const totalCells = N + 1; // includes clone of slide[0] at the end

  const [idx, setIdx] = useState(0);
  const [animated, setAnimated] = useState(true);

  // Tick: advance idx every INTERVAL_MS.
  useEffect(() => {
    if (N < 2) return;
    const id = setInterval(() => {
      setAnimated(true);
      setIdx((i) => i + 1);
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, [N]);

  // When we've animated onto the clone (idx === N), snap back to 0 with
  // animation disabled so the jump is invisible. Then re-enable.
  useEffect(() => {
    if (idx !== N) return;
    const tSnap = setTimeout(() => {
      setAnimated(false);
      setIdx(0);
    }, TRANSITION_MS + 30);
    return () => clearTimeout(tSnap);
  }, [idx, N]);

  // After a snap-back, the next render has animated=false. Re-enable in
  // the next frame so the following tick animates normally again.
  useEffect(() => {
    if (animated) return;
    const r = requestAnimationFrame(() => setAnimated(true));
    return () => cancelAnimationFrame(r);
  }, [animated]);

  // Each cell is 100% of the viewport; track is totalCells * 100% wide.
  const cellPct = 100 / totalCells;
  const translatePct = idx * cellPct;

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0 flex h-full"
        style={{
          width: `${totalCells * 100}%`,
          transform: `translateX(-${translatePct}%)`,
          transition: animated && N > 1 ? `transform ${TRANSITION_MS}ms cubic-bezier(0.7, 0, 0.2, 1)` : "none",
          willChange: "transform",
        }}
      >
        {effective.map((slide, i) => (
          <div key={slide.id} className="relative h-full" style={{ width: `${cellPct}%` }}>
            <Image
              src={slide.image_url}
              alt={slide.alt ?? ""}
              fill
              priority={i === 0}
              sizes="100vw"
              className="object-cover object-center"
              unoptimized={slide.image_url.includes("erp.hiltontailoringhouse.com")}
            />
          </div>
        ))}
        {N > 1 && (
          <div key={`${effective[0].id}-clone`} className="relative h-full" style={{ width: `${cellPct}%` }}>
            <Image
              src={effective[0].image_url}
              alt={effective[0].alt ?? ""}
              fill
              sizes="100vw"
              className="object-cover object-center"
              unoptimized={effective[0].image_url.includes("erp.hiltontailoringhouse.com")}
            />
          </div>
        )}
      </div>
    </div>
  );
}
