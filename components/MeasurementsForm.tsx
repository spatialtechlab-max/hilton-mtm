"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, Ruler } from "lucide-react";
import {
  measurementGroups, allMeasurements,
  type Measurement, type MeasurementGroup,
  type MeasurementUnit, type MeasurementValues,
} from "@/lib/customizer";

/**
 * Stand-alone version of the customizer's measurement step. Used by:
 *  - /account/measurements  (customer fills the tape-measure flow once)
 *  - the customizer (TODO: pre-fill saved values + edit-on-demand)
 *
 * Same MeasurementCard logic the customize page has — video clip per
 * measurement, lazy-loaded via IntersectionObserver, plus a numeric input
 * that writes back to the parent's state.
 */
export function MeasurementsForm({
  values, unit, onSetValue, onSetUnit,
  groups = measurementGroups,
}: {
  values: MeasurementValues;
  unit: MeasurementUnit;
  onSetValue: (slug: string, value: string) => void;
  onSetUnit: (unit: MeasurementUnit) => void;
  groups?: MeasurementGroup[];
}) {
  const filledCount = groups
    .flatMap((g) => g.items)
    .filter((m) => (values[m.slug] ?? "").trim() !== "").length;
  const totalCount = groups.flatMap((g) => g.items).length;
  void allMeasurements; // keep import live for callers that need the count helper

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
      <div className="lg:col-span-4">
        <div className="inline-flex items-stretch border border-black/15">
          {(["cm", "in"] as MeasurementUnit[]).map((u) => {
            const active = u === unit;
            return (
              <button
                key={u}
                type="button"
                onClick={() => onSetUnit(u)}
                className={`text-eyebrow px-5 py-3 transition-colors ${
                  active
                    ? "bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)]"
                    : "text-[var(--color-charcoal-800)] hover:text-[var(--color-burgundy-700)]"
                }`}
              >
                {u === "cm" ? "Centimetres" : "Inches"}
              </button>
            );
          })}
        </div>
        <div className="mt-6 inline-flex items-center gap-2 text-[0.85rem] text-[var(--color-charcoal-500)]">
          <Ruler size={14} strokeWidth={1.5} />
          {filledCount} of {totalCount} entered
        </div>
      </div>

      <div className="lg:col-span-8 flex flex-col gap-12">
        {groups.map((group) => (
          <section key={group.slug}>
            <header className="mb-5 border-b border-black/10 pb-3">
              <div className="text-eyebrow text-[var(--color-burgundy-700)]">{group.title}</div>
              <p className="text-[0.9rem] text-[var(--color-charcoal-500)] mt-1.5 max-w-xl">{group.intro}</p>
            </header>
            <div className="grid grid-cols-1 gap-4">
              {group.items.map((m, idx) => (
                <MeasurementCard
                  key={m.slug}
                  item={m}
                  index={idx + 1}
                  unit={unit}
                  value={values[m.slug] ?? ""}
                  onChange={(v) => onSetValue(m.slug, v)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function MeasurementCard({
  item, index, unit, value, onChange,
}: {
  item: Measurement;
  index: number;
  unit: MeasurementUnit;
  value: string;
  onChange: (v: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.play().then(() => setIsPlaying(true)).catch(() => {});
        } else {
          el.pause();
          setIsPlaying(false);
        }
      },
      { threshold: 0.25, rootMargin: "300px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  function togglePlay() {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) { el.play().catch(() => {}); setIsPlaying(true); }
    else { el.pause(); setIsPlaying(false); }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] border border-black/10 bg-[var(--color-ivory-100)] overflow-hidden">
      <div className="relative aspect-[4/3] md:aspect-auto bg-[var(--color-ivory-200)] overflow-hidden">
        <video
          ref={videoRef}
          src={`/measurements/${item.slug}.mp4`}
          poster={`/measurements/posters/${item.slug}.jpg`}
          loop
          muted
          playsInline
          preload="none"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <button
          type="button"
          onClick={togglePlay}
          aria-label={isPlaying ? "Pause demonstration" : "Play demonstration"}
          className="absolute bottom-3 right-3 inline-flex items-center justify-center w-9 h-9 bg-[var(--color-ivory-100)]/85 text-[var(--color-burgundy-700)] backdrop-blur-sm hover:bg-[var(--color-ivory-100)] transition-colors"
        >
          {isPlaying ? <Pause size={14} strokeWidth={1.5} /> : <Play size={14} strokeWidth={1.5} />}
        </button>
      </div>

      <div className="p-5 lg:p-6 flex flex-col justify-between gap-4">
        <div>
          <div className="text-[0.7rem] tracking-[0.2em] uppercase text-[var(--color-charcoal-500)]">
            N° {String(index).padStart(2, "0")}
          </div>
          <h3 className="text-display text-[1.3rem] lg:text-[1.45rem] mt-1.5 text-[var(--color-charcoal-900)] leading-tight">
            {item.label}
          </h3>
          <p className="text-[0.85rem] text-[var(--color-charcoal-700)] mt-2 leading-relaxed">
            {item.helper}
          </p>
        </div>
        <label className="block">
          <span className="sr-only">{item.label} measurement</span>
          <div className="flex items-stretch border border-black/15 focus-within:border-[var(--color-burgundy-700)] transition-colors bg-[var(--color-ivory-100)]">
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step={0.5}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder=""
              className="flex-1 bg-transparent px-4 py-3 text-[1.1rem] text-[var(--color-charcoal-900)] placeholder:text-[var(--color-charcoal-500)] focus:outline-none"
            />
            <span className="self-center px-4 text-eyebrow text-[var(--color-charcoal-500)] border-l border-black/10">
              {unit}
            </span>
          </div>
        </label>
      </div>
    </div>
  );
}
