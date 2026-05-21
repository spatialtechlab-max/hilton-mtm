"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Download, Sparkles, Ruler, Play, Pause } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  steps, tiers, findOption, defaultSelections, type Selections,
  measurementGroups, allMeasurements, defaultMeasurements,
  type MeasurementValues, type MeasurementUnit, type Measurement,
} from "@/lib/customizer";
import { buildSpecPdf } from "@/lib/specSheet";

type Phase = "spec" | "measurements" | "tier" | "summary";

const STORAGE_KEY = "hilton-customizer";

export default function CustomizePage() {
  const [selections,   setSelections]   = useState<Selections>(defaultSelections);
  const [measurements, setMeasurements] = useState<MeasurementValues>(defaultMeasurements);
  const [unit,         setUnit]         = useState<MeasurementUnit>("cm");
  const [stepIdx, setStepIdx]       = useState(0);
  const [phase, setPhase]           = useState<Phase>("spec");
  const [tier, setTier]             = useState<string>("signature");
  const [downloading, setDownloading] = useState(false);

  // Persist progress to localStorage so a refresh doesn't lose work.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as {
        selections?: Selections;
        measurements?: MeasurementValues;
        unit?: MeasurementUnit;
        phase?: Phase;
        stepIdx?: number;
        tier?: string;
      };
      if (saved.selections)   setSelections({ ...defaultSelections(), ...saved.selections });
      if (saved.measurements) setMeasurements({ ...defaultMeasurements(), ...saved.measurements });
      if (saved.unit === "cm" || saved.unit === "in") setUnit(saved.unit);
      if (saved.phase)        setPhase(saved.phase);
      if (typeof saved.stepIdx === "number") setStepIdx(saved.stepIdx);
      if (saved.tier)         setTier(saved.tier);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ selections, measurements, unit, phase, stepIdx, tier }),
    );
  }, [selections, measurements, unit, phase, stepIdx, tier]);

  const step = steps[stepIdx];
  const isLastSpec = stepIdx === steps.length - 1;

  function pick(value: string) {
    setSelections((s) => ({ ...s, [step.slug]: value }));
  }

  function setMeasurement(slug: string, value: string) {
    setMeasurements((m) => ({ ...m, [slug]: value }));
  }

  function next() {
    if (phase === "spec") {
      if (isLastSpec) setPhase("measurements");
      else setStepIdx((i) => i + 1);
    } else if (phase === "measurements") {
      setPhase("tier");
    } else if (phase === "tier") {
      setPhase("summary");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function back() {
    if (phase === "summary")           setPhase("tier");
    else if (phase === "tier")         setPhase("measurements");
    else if (phase === "measurements") setPhase("spec");
    else if (stepIdx > 0) setStepIdx((i) => i - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function downloadPdf() {
    setDownloading(true);
    try {
      const bytes = await buildSpecPdf(selections, tier, undefined, { measurements, unit });
      // Cast to a fresh Uint8Array (over ArrayBufferLike) so Blob accepts it
      const arr = new Uint8Array(bytes);
      const blob = new Blob([arr], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Hilton-Bespoke-Specification.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  function resetAll() {
    localStorage.removeItem(STORAGE_KEY);
    setSelections(defaultSelections());
    setMeasurements(defaultMeasurements());
    setUnit("cm");
    setStepIdx(0);
    setPhase("spec");
    setTier("signature");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="pt-32 md:pt-40 pb-24 min-h-[80vh]">
      <div className="container-editorial">

        {/* ── Back to House link ─────────────────────────────────────── */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-eyebrow text-[var(--color-charcoal-500)] hover:text-[var(--color-burgundy-700)] transition-colors mb-8"
        >
          <ArrowLeft size={14} strokeWidth={1.5} />
          The House
        </Link>

        {/* ── Hero / intro ───────────────────────────────────────────── */}
        <header className="mb-12 lg:mb-16">
          <span className="text-eyebrow text-[var(--color-burgundy-700)]">Design Yours</span>
          <h1 className="text-display text-[clamp(2.75rem,7vw,6rem)] mt-4 leading-[0.95] text-[var(--color-charcoal-900)]">
            Bespoke, one decision at a time.
          </h1>
          <p className="mt-5 max-w-2xl text-[1rem] text-[var(--color-charcoal-700)] leading-relaxed">
            Twelve quiet choices, then a commission tier. At the end, take your specification with you — printed,
            or sent straight to the atelier.
          </p>
        </header>

        {/* ── Progress dock ──────────────────────────────────────────── */}
        <ProgressDock phase={phase} stepIdx={stepIdx} />

        {/* ── Body ───────────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {phase === "spec" && (
            <motion.section
              key={`spec-${step.slug}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16"
            >
              <div className="lg:col-span-4">
                <span className="text-eyebrow text-[var(--color-burgundy-700)]">{step.eyebrow}</span>
                <h2 className="text-display text-[clamp(2rem,3.5vw,3.25rem)] mt-3 leading-[1.05]">
                  {step.title}
                </h2>
                <p className="mt-4 text-[1.05rem] text-[var(--color-charcoal-700)] italic">
                  {step.subtitle}
                </p>
                <p className="mt-5 text-[0.95rem] text-[var(--color-charcoal-700)] leading-relaxed">
                  {step.description}
                </p>
                <div className="mt-8 hidden lg:block">
                  <SelectionsSidebar selections={selections} currentIdx={stepIdx} />
                </div>
              </div>

              <div className="lg:col-span-8">
                <OptionGrid
                  step={step}
                  selected={selections[step.slug]}
                  onPick={pick}
                />
              </div>
            </motion.section>
          )}

          {phase === "measurements" && (
            <motion.section
              key="measurements"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="mt-12"
            >
              <MeasurementsPhase
                values={measurements}
                unit={unit}
                onSetUnit={setUnit}
                onSetValue={setMeasurement}
              />
            </motion.section>
          )}

          {phase === "tier" && (
            <motion.section
              key="tier"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="mt-12"
            >
              <div className="max-w-3xl">
                <span className="text-eyebrow text-[var(--color-burgundy-700)]">Final · Commission</span>
                <h2 className="text-display text-[clamp(2.25rem,4vw,3.5rem)] mt-3 leading-[1.05]">
                  Choose your tier.
                </h2>
                <p className="mt-5 text-[1rem] text-[var(--color-charcoal-700)] leading-relaxed">
                  Same garment, three depths of craft. The Signature tier is the house standard. Couture is hand-cut and
                  hand-stitched, with three fittings.
                </p>
              </div>

              <TierPicker tier={tier} onPick={setTier} />
            </motion.section>
          )}

          {phase === "summary" && (
            <motion.section
              key="summary"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="mt-12"
            >
              <SummaryPanel
                selections={selections}
                measurements={measurements}
                unit={unit}
                tier={tier}
                onDownload={downloadPdf}
                downloading={downloading}
                onReset={resetAll}
              />
            </motion.section>
          )}
        </AnimatePresence>

        {/* ── Footer controls ────────────────────────────────────────── */}
        {phase !== "summary" && (
          <nav className="mt-16 lg:mt-20 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={back}
              disabled={phase === "spec" && stepIdx === 0}
              className="text-eyebrow inline-flex items-center gap-3 text-[var(--color-charcoal-800)] hover:text-[var(--color-burgundy-700)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ArrowLeft size={16} strokeWidth={1.5} /> Back
            </button>
            <button
              type="button"
              onClick={next}
              className="text-eyebrow inline-flex items-center gap-3 bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] px-8 py-4 hover:bg-[var(--color-burgundy-800)] transition-colors"
            >
              {phase === "tier"
                ? "Review specification"
                : phase === "measurements"
                  ? "Choose your tier"
                  : isLastSpec
                    ? "Take your measurements"
                    : "Next"}
              <ArrowRight size={16} strokeWidth={1.5} />
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────── Progress dock ─────────────────────────── */

function ProgressDock({ phase, stepIdx }: { phase: Phase; stepIdx: number }) {
  // Total = N spec dots + 1 measurements + 1 tier + 1 summary.
  const total = steps.length + 3;
  const currentIndex =
    phase === "spec"         ? stepIdx :
    phase === "measurements" ? steps.length :
    phase === "tier"         ? steps.length + 1 :
                                steps.length + 2;
  const label =
    phase === "spec"         ? `Step ${stepIdx + 1} of ${steps.length}` :
    phase === "measurements" ? "Your measurements" :
    phase === "tier"         ? "Commission tier" :
                                "Specification ready";

  return (
    <div className="border-y border-black/10 py-5 flex items-center gap-6 overflow-x-auto no-scrollbar">
      <span className="text-eyebrow text-[var(--color-charcoal-500)] shrink-0">{label}</span>
      <div className="flex items-center gap-2 shrink-0">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={`h-[2px] w-8 transition-all duration-500 ${
              i < currentIndex
                ? "bg-[var(--color-burgundy-700)]"
                : i === currentIndex
                  ? "bg-[var(--color-burgundy-700)] w-12"
                  : "bg-[var(--color-charcoal-900)]/15"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────── Option grid ─────────────────────────── */

function OptionGrid({
  step, selected, onPick,
}: {
  step: typeof steps[number];
  selected: string;
  onPick: (value: string) => void;
}) {
  const n = step.options.length;
  // Decide a sensible grid by option count
  const cols =
    n <= 2 ? "grid-cols-1 sm:grid-cols-2" :
    n <= 4 ? "grid-cols-2 lg:grid-cols-2" :
    n <= 6 ? "grid-cols-2 lg:grid-cols-3" :
              "grid-cols-2 md:grid-cols-3 lg:grid-cols-4";

  return (
    <div className={`grid ${cols} gap-5`}>
      {step.options.map((opt) => {
        const active = opt.value === selected;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onPick(opt.value)}
            className={`group relative flex flex-col items-center text-left border transition-all duration-300 hover:border-[var(--color-burgundy-700)] ${
              active
                ? "border-[var(--color-burgundy-700)] bg-[var(--color-ivory-200)]"
                : "border-black/10 bg-[var(--color-ivory-100)]"
            }`}
          >
            <div className="relative w-full aspect-[3/4]">
              <Image
                src={`/customizer/${step.slug}/${opt.value}.png`}
                alt={opt.label}
                fill
                sizes="(min-width: 1024px) 25vw, 50vw"
                className="object-contain p-3 md:p-5"
              />
              {active && (
                <span className="absolute top-3 right-3 inline-flex items-center justify-center w-7 h-7 bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] rounded-full">
                  <Check size={14} strokeWidth={2} />
                </span>
              )}
            </div>
            <div className="w-full border-t border-black/5 px-4 py-4 text-center">
              <div className={`text-display text-[1.1rem] leading-tight ${
                active ? "text-[var(--color-burgundy-700)]" : "text-[var(--color-charcoal-900)]"
              }`}>
                {opt.label}
              </div>
              {opt.note && (
                <div className="text-[0.75rem] text-[var(--color-charcoal-500)] mt-1">{opt.note}</div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ─────────────────────────── Selections sidebar ─────────────────────────── */

function SelectionsSidebar({ selections, currentIdx }: { selections: Selections; currentIdx: number }) {
  // Only show steps the user has already moved past — not future defaults.
  const completed = steps.slice(0, currentIdx);
  if (completed.length === 0) return null;
  return (
    <div className="border-t border-black/10 pt-6">
      <div className="text-eyebrow text-[var(--color-charcoal-500)] mb-4">Your specification so far</div>
      <dl className="space-y-2.5">
        {completed.map((s) => {
          const opt = findOption(s.slug, selections[s.slug]);
          if (!opt) return null;
          return (
            <div key={s.slug} className="flex justify-between gap-3 text-[0.85rem]">
              <dt className="text-[var(--color-charcoal-500)]">{s.title}</dt>
              <dd className="text-[var(--color-charcoal-900)] text-right">{opt.label}</dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}

/* ─────────────────────────── Tier picker ─────────────────────────── */

function TierPicker({ tier, onPick }: { tier: string; onPick: (slug: string) => void }) {
  return (
    <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-6">
      {tiers.map((t) => {
        const active = t.slug === tier;
        return (
          <button
            key={t.slug}
            type="button"
            onClick={() => onPick(t.slug)}
            className={`relative text-left p-8 lg:p-10 border-2 transition-all duration-300 group ${
              active
                ? "border-[var(--color-burgundy-700)] bg-[var(--color-ivory-200)]"
                : "border-black/10 bg-[var(--color-ivory-100)] hover:border-[var(--color-burgundy-700)]/40"
            }`}
          >
            {t.highlight && !active && (
              <span className="absolute top-4 right-4 inline-flex items-center gap-1 text-[0.65rem] tracking-[0.2em] uppercase text-[var(--color-burgundy-700)]">
                <Sparkles size={11} strokeWidth={1.5} /> House standard
              </span>
            )}
            {active && (
              <span className="absolute top-4 right-4 inline-flex items-center justify-center w-7 h-7 bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] rounded-full">
                <Check size={14} strokeWidth={2} />
              </span>
            )}
            <div className="text-eyebrow text-[var(--color-burgundy-700)]">{t.tagline}</div>
            <h3 className="text-display text-[clamp(2rem,3.2vw,3rem)] mt-3 text-[var(--color-charcoal-900)]">
              {t.name}
            </h3>
            <div className="text-display text-[1.85rem] mt-2 text-[var(--color-burgundy-700)]">{t.price}</div>
            <div className="mt-3 text-[0.85rem] text-[var(--color-charcoal-500)]">
              {t.lead} · {t.fittings}
            </div>
            <ul className="mt-6 space-y-2 text-[0.9rem] text-[var(--color-charcoal-800)] leading-relaxed">
              {t.features.map((f) => (
                <li key={f} className="flex gap-2.5">
                  <span aria-hidden className="text-[var(--color-burgundy-700)] shrink-0">·</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </button>
        );
      })}
    </div>
  );
}

/* ─────────────────────────── Measurements phase ─────────────────────────── */

function MeasurementsPhase({
  values, unit, onSetUnit, onSetValue,
}: {
  values: MeasurementValues;
  unit: MeasurementUnit;
  onSetUnit: (u: MeasurementUnit) => void;
  onSetValue: (slug: string, value: string) => void;
}) {
  const filledCount = useMemo(
    () => allMeasurements.filter((m) => (values[m.slug] ?? "").trim() !== "").length,
    [values],
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
      <div className="lg:col-span-4">
        <span className="text-eyebrow text-[var(--color-burgundy-700)]">N° 13 · Measurements</span>
        <h2 className="text-display text-[clamp(2rem,3.5vw,3.25rem)] mt-3 leading-[1.05]">
          Take your measurements.
        </h2>
        <p className="mt-4 text-[1.05rem] text-[var(--color-charcoal-700)] italic">
          A few minutes with a soft tape — fourteen quiet numbers.
        </p>
        <p className="mt-5 text-[0.95rem] text-[var(--color-charcoal-700)] leading-relaxed">
          Each clip is a short loop showing precisely how the tape should sit. Take what you can — anything you skip,
          we will refine at the fitting. Stand naturally, with a thin shirt; pull the tape snug but never tight.
        </p>

        {/* Unit toggle */}
        <div className="mt-8 inline-flex items-stretch border border-black/15">
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

        <div className="mt-6 inline-flex items-center gap-2 text-[0.8rem] text-[var(--color-charcoal-500)]">
          <Ruler size={14} strokeWidth={1.5} />
          {filledCount} of {allMeasurements.length} entered
        </div>

        <div className="mt-10 p-6 border border-black/10 bg-[var(--color-ivory-200)]">
          <div className="text-eyebrow text-[var(--color-burgundy-700)] mb-2">Prefer in-person?</div>
          <p className="text-[0.9rem] text-[var(--color-charcoal-800)] leading-relaxed">
            Skip ahead and book a fitting — the master tailor will take every measurement at the atelier.
            Your specification stays saved either way.
          </p>
          <Link
            href="/book"
            className="mt-4 inline-flex items-center gap-2 text-eyebrow text-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-800)]"
          >
            Book a fitting <ArrowRight size={14} strokeWidth={1.5} />
          </Link>
        </div>
      </div>

      <div className="lg:col-span-8 flex flex-col gap-12">
        {measurementGroups.map((group) => (
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
  const [isPlaying, setIsPlaying] = useState(true);

  // Pause when scrolled out of view to keep frame budget light on the 14-card list.
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.play().catch(() => {});
        } else {
          el.pause();
        }
      },
      { threshold: 0.35 },
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
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
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
              placeholder="—"
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

/* ─────────────────────────── Summary ─────────────────────────── */

function SummaryPanel({
  selections, measurements, unit, tier, onDownload, downloading, onReset,
}: {
  selections: Selections;
  measurements: MeasurementValues;
  unit: MeasurementUnit;
  tier: string;
  onDownload: () => void;
  downloading: boolean;
  onReset: () => void;
}) {
  const tierObj = tiers.find((t) => t.slug === tier) ?? tiers[1];
  const rows = useMemo(
    () => steps.map((s) => ({ step: s, option: findOption(s.slug, selections[s.slug]) })),
    [selections],
  );
  const measurementRows = useMemo(
    () => allMeasurements
      .map((m) => ({ m, v: (measurements[m.slug] ?? "").trim() }))
      .filter((r) => r.v !== ""),
    [measurements],
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
      <div className="lg:col-span-7">
        <span className="text-eyebrow text-[var(--color-burgundy-700)]">Specification ready</span>
        <h2 className="text-display text-[clamp(2.5rem,5vw,4.25rem)] mt-3 leading-[1.02]">
          Your bespoke is set.
        </h2>
        <p className="mt-5 max-w-xl text-[1rem] text-[var(--color-charcoal-700)] leading-relaxed">
          Download a one-page specification PDF, or take the summary below to your fitting.
          We keep the pattern on file for life.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={onDownload}
            disabled={downloading}
            className="text-eyebrow inline-flex items-center gap-3 bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] px-8 py-4 hover:bg-[var(--color-burgundy-800)] transition-colors disabled:opacity-60"
          >
            <Download size={16} strokeWidth={1.5} />
            {downloading ? "Preparing PDF…" : "Download specification"}
          </button>
          <Link
            href="/book"
            className="text-eyebrow inline-flex items-center gap-3 border border-[var(--color-burgundy-700)] text-[var(--color-burgundy-700)] px-8 py-4 hover:bg-[var(--color-burgundy-700)] hover:text-[var(--color-ivory-100)] transition-colors"
          >
            Book a fitting
          </Link>
          <button
            type="button"
            onClick={onReset}
            className="text-eyebrow text-[var(--color-charcoal-500)] hover:text-[var(--color-burgundy-700)] transition-colors"
          >
            Start over
          </button>
        </div>
      </div>

      <div className="lg:col-span-5 bg-[var(--color-ivory-200)] p-8 lg:p-10">
        <div className="text-eyebrow text-[var(--color-burgundy-700)] mb-1">Commission</div>
        <div className="text-display text-[2.25rem] text-[var(--color-charcoal-900)]">{tierObj.name}</div>
        <div className="text-display text-[1.5rem] text-[var(--color-burgundy-700)] mt-1">{tierObj.price}</div>
        <div className="text-[0.8rem] text-[var(--color-charcoal-500)] mt-1">
          {tierObj.lead} · {tierObj.fittings}
        </div>

        <div className="my-6 h-px bg-black/10" />

        <div className="text-eyebrow text-[var(--color-burgundy-700)] mb-4">Specification</div>
        <dl className="space-y-3">
          {rows.map(({ step, option }) =>
            option ? (
              <div key={step.slug} className="flex justify-between gap-3 text-[0.85rem]">
                <dt className="text-[var(--color-charcoal-500)]">{step.title}</dt>
                <dd className="text-[var(--color-charcoal-900)] text-right">{option.label}</dd>
              </div>
            ) : null
          )}
        </dl>

        {measurementRows.length > 0 && (
          <>
            <div className="my-6 h-px bg-black/10" />
            <div className="text-eyebrow text-[var(--color-burgundy-700)] mb-4">
              Measurements · {unit}
            </div>
            <dl className="space-y-3">
              {measurementRows.map(({ m, v }) => (
                <div key={m.slug} className="flex justify-between gap-3 text-[0.85rem]">
                  <dt className="text-[var(--color-charcoal-500)]">{m.label}</dt>
                  <dd className="text-[var(--color-charcoal-900)] text-right">{v} {unit}</dd>
                </div>
              ))}
            </dl>
          </>
        )}
      </div>
    </div>
  );
}
