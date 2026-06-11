"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { HeroSlideRow } from "@/lib/heroSlidesServer";

/**
 * Slide-left hero carousel. Advances every 4 seconds. Reduced-motion
 * users get a no-animation crossfade so the page never imposes a moving
 * banner on people who've opted out.
 *
 * The slides are rendered side-by-side inside a track that translates
 * horizontally. The track is twice as long as the viewport so the
 * outgoing and incoming slides cover the full width during the slide.
 */
const INTERVAL_MS = 4000;
const TRANSITION_MS = 900;

export function HeroRotator({ slides, fallbackSrc, fallbackAlt }: {
  slides: HeroSlideRow[];
  fallbackSrc: string;
  fallbackAlt: string;
}) {
  const effective = slides.length > 0
    ? slides
    : [{ id: "fallback", image_url: fallbackSrc, alt: fallbackAlt, position: 0, active: true }];

  const [idx, setIdx] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (effective.length < 2) return;
    timer.current = setInterval(() => {
      setIdx((i) => (i + 1) % effective.length);
    }, INTERVAL_MS);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [effective.length]);

  // Two cells: the current slide, and the next one queued to the right.
  // When idx advances, the track translates by -100% which slides the
  // current slide out left and brings the next slide in from the right.
  const current = effective[idx];
  const next    = effective[(idx + 1) % effective.length];

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        key={current.id}
        className="absolute inset-0 flex w-[200%] hero-slide-track"
        style={{ ["--hero-transition" as string]: `${TRANSITION_MS}ms` }}
      >
        <div className="relative w-1/2 h-full">
          <Image
            src={current.image_url}
            alt={current.alt ?? ""}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
            unoptimized={current.image_url.includes("erp.hiltontailoringhouse.com")}
          />
        </div>
        <div className="relative w-1/2 h-full">
          <Image
            src={next.image_url}
            alt={next.alt ?? ""}
            fill
            sizes="100vw"
            className="object-cover object-center"
            unoptimized={next.image_url.includes("erp.hiltontailoringhouse.com")}
          />
        </div>
      </div>

      <style jsx>{`
        .hero-slide-track {
          animation: heroSlide var(--hero-transition) cubic-bezier(0.7, 0, 0.2, 1) ${INTERVAL_MS - TRANSITION_MS}ms forwards;
          will-change: transform;
        }
        @keyframes heroSlide {
          from { transform: translateX(0%); }
          to   { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-slide-track { animation: none; transform: translateX(0%); }
        }
      `}</style>
    </div>
  );
}
