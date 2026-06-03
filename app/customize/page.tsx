"use client";

// useSearchParams triggers Next 15 to opt out of static prerendering for
// this route. Mark it dynamic explicitly so the build doesn't try.
export const dynamic = "force-dynamic";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Download, Sparkles, Ruler, Play, Pause, Pencil, ShoppingBag, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  tiers, defaultSelections, type Selections,
  defaultMeasurements,
  type MeasurementValues, type MeasurementUnit, type Measurement, type MeasurementGroup,
  type StepCategory, measurementGroupsForCategory,
  categoryHasTiers, isCustomizeCategory, tierPriceFor,
} from "@/lib/customizer";
import {
  type LiveStep, staticLiveSteps, fetchLiveSteps, visibleLiveSteps,
  surchargeTotal, findLiveOption, parsePrice, formatBhd,
} from "@/lib/liveConfig";
import { mergeLiveAndStatic } from "@/lib/liveConfigMerge";
import { findProduct } from "@/lib/libraries";
import { buildSpecPdf } from "@/lib/specSheet";
import { AuthForm } from "@/components/AuthForm";
import { useAuth } from "@/components/AuthProvider";
import { addToCart as pushToCart } from "@/lib/cart";
import { DesignYoursPicker } from "@/components/DesignYoursPicker";

type Phase = "fabric" | "tier" | "spec" | "measurements" | "summary" | "auth" | "cart";

// Phases that belong to the design flow (show the step progress dock + wizard controls).
const DESIGN_PHASES: Phase[] = ["fabric", "tier", "spec", "measurements", "summary"];

type Fabric = {
  sku: string;
  code?: string;
  name: string;
  brand: string;
  composition: string;
  pattern: string;
  color: string;
  shade?: string;
  weight: string;
  size?: string;
  origin: string;
  price: string;
  priceNum: number;
  image: string;
  gallery?: string[];
  erpCategory?: string;
  erpCategoryID?: number;
};

const CATEGORY_COPY: Record<StepCategory, { h1: string; intro: string }> = {
  suit: {
    h1: "Design Your Own.",
    intro: "Made to measure, one deliberate decision at a time. Navigate through curated design choices to shape your garment, then select your depth of craft. Once your design is complete, save your specification or send it directly to the Hilton MTM atelier to begin your commission.",
  },
  jacket: {
    h1: "Your jacket, made to measure.",
    intro: "Choose your commission, then the cut and detail of the jacket and your measurements. At the end, take your specification with you.",
  },
  shirt: {
    h1: "Your shirt, made to measure.",
    intro: "A few quiet choices — collar, cuff, and fit — then your measurements. At the end, take your specification with you.",
  },
  trouser: {
    h1: "Your trousers, made to measure.",
    intro: "Choose the cut, the hem, and the waist, then your measurements. At the end, take your specification with you.",
  },
};

/* useSearchParams in CustomizeInner requires a Suspense boundary at
 * the page level for Next 15's prerender. The fallback is the same
 * dark loading line the existing flows use so the transition reads as
 * a single experience. */
export default function CustomizePage() {
  return (
    <Suspense
      fallback={
        <div className="pt-40 pb-24 min-h-[70vh] flex items-center justify-center">
          <span className="text-eyebrow text-[var(--color-charcoal-500)]">Loading…</span>
        </div>
      }
    >
      <CustomizeInner />
    </Suspense>
  );
}

function CustomizeInner() {
  const [category, setCategory] = useState<StepCategory>("suit");
  const [sku, setSku] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [allSteps, setAllSteps] = useState<LiveStep[]>(staticLiveSteps);
  const [selections,   setSelections]   = useState<Selections>(defaultSelections);
  const [measurements, setMeasurements] = useState<MeasurementValues>(defaultMeasurements);
  const [unit,         setUnit]         = useState<MeasurementUnit>("cm");
  const [stepIdx, setStepIdx]       = useState(0);
  const [phase, setPhase]           = useState<Phase>("fabric");
  const [tier, setTier]             = useState<string>("signature");
  const [downloading, setDownloading] = useState(false);
  const [fabrics, setFabrics]       = useState<Fabric[]>([]);
  const [fabricsLoading, setFabricsLoading] = useState(false);
  const [selectedFabric, setSelectedFabric] = useState<Fabric | null>(null);
  // Whether the visitor arrived with a category in the URL. If not, we
  // show the Design Yours category-picker landing tiles instead of
  // silently defaulting to suit.
  const [hasUrlCategory, setHasUrlCategory] = useState(true);
  const { user } = useAuth();
  const router = useRouter();
  // useSearchParams gives us a reactive value that re-runs the URL-reading
  // effect whenever a Next.js Link / router.push changes the query string
  // (the default useEffect with [] would have read the URL once on mount
  // only — picking a tile from the Design Yours landing wouldn't propagate).
  const searchParams = useSearchParams();

  const storageKey = `hilton-customizer-${category}`;
  const hasTiers   = categoryHasTiers(category);
  const tierObj    = tiers.find((t) => t.slug === tier) ?? tiers[1];

  // Category- and tier-aware config from the live DB config (waistcoat sub-steps conditional)
  const activeSteps        = useMemo(() => visibleLiveSteps(allSteps, category, tier, selections), [allSteps, category, tier, selections]);
  const activeGroups       = useMemo(() => measurementGroupsForCategory(category), [category]);
  const activeMeasurements = useMemo(() => activeGroups.flatMap((g) => g.items), [activeGroups]);

  // Pricing: every category now uses tier-based pricing, but the tier
  // *price* depends on the category — a Bespoke shirt isn't a Bespoke
  // suit. `tierPriceFor` returns the right BHD label per (cat × tier).
  const product    = useMemo(() => (sku ? findProduct(sku) : null), [sku]);
  const basePrice  = parsePrice(tierPriceFor(category, tier));
  const surcharge  = useMemo(() => surchargeTotal(activeSteps, selections), [activeSteps, selections]);
  const grandTotal = basePrice + surcharge;

  // Merge Supabase-backed admin config with the static defaults. Logic
  // lives in lib/liveConfigMerge.ts so it can be unit-tested; this
  // useEffect is now just glue to Supabase + React state.
  useEffect(() => {
    fetchLiveSteps().then((payload) => {
      if (!payload) return;
      const { steps: live, disabledStepSlugs, disabledOptionsByStep } = payload;
      setAllSteps((staticSteps) =>
        mergeLiveAndStatic({
          staticSteps,
          liveSteps: live,
          disabledStepSlugs,
          disabledOptionsByStep,
        }),
      );
    });
  }, []);

  // One-time init: read ?category from the URL, then restore that category's saved state.
  // Entry rule: if the URL pre-selects a SKU (came from a PDP "Customise" CTA),
  // skip fabric pick — they already chose one. Otherwise start at "fabric".
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // Accept both ?category= and ?garment= so inbound links from any
    // surface (homepage tiles, library PDPs, marketing links) resolve.
    const raw = params.get("category") ?? params.get("garment");
    const skuParam = params.get("sku");
    setSku(skuParam);
    // Track whether the URL carried a real category. If not, the page
    // renders the Design Yours picker tiles below instead of the
    // customizer. We still set `category` to a safe default so the
    // existing hooks behind the picker keep their types happy.
    const validUrlCategory = isCustomizeCategory(raw);
    setHasUrlCategory(validUrlCategory);
    const cat: StepCategory = validUrlCategory ? raw : "suit";
    // Sebastian (the concierge) can pass ?tier=signature etc. We honour it
    // even when it overrides the user's prior saved state, so that picking
    // "Bespoke" in chat truly arrives in the bespoke flow.
    const tierParam = params.get("tier");
    const validTiers = ["essential", "signature", "bespoke"] as const;
    if (tierParam && (validTiers as readonly string[]).includes(tierParam)) {
      setTier(tierParam);
    }
    setCategory(cat);
    // Entry rule: Fabric pick is ALWAYS the first phase, even when the user
    // arrived from a PDP "Customise" CTA. The PDP item is inspiration, not a
    // committed fabric — the user still picks a real cloth from the library.
    try {
      const saved = JSON.parse(localStorage.getItem(`hilton-customizer-${cat}`) || "null") as null | {
        selections?: Selections; measurements?: MeasurementValues; unit?: MeasurementUnit;
        phase?: Phase; stepIdx?: number; tier?: string; selectedFabric?: Fabric;
      };
      if (saved) {
        if (saved.selections)   setSelections({ ...defaultSelections(), ...saved.selections });
        if (saved.measurements) setMeasurements({ ...defaultMeasurements(), ...saved.measurements });
        if (saved.unit === "cm" || saved.unit === "in") setUnit(saved.unit);
        if (typeof saved.stepIdx === "number") setStepIdx(saved.stepIdx);
        if (saved.tier)         setTier(saved.tier);
        if (saved.selectedFabric) setSelectedFabric(saved.selectedFabric);
        // Restore the saved phase only if a fabric was actually picked.
        // Otherwise start over at Fabric so the flow always begins there.
        if (saved.phase && saved.selectedFabric) {
          setPhase(saved.phase);
        } else {
          setPhase("fabric");
        }
      } else {
        setPhase("fabric");
      }
    } catch {
      setPhase("fabric");
    }
    setReady(true);
    // Re-run on every URL query change (Next Link / router.push) so the
    // page reacts to picking a tile from the Design Yours landing.
  }, [searchParams]);

  // Fetch fabrics whenever we land on (or return to) the fabric phase.
  useEffect(() => {
    if (phase !== "fabric") return;
    if (fabrics.length > 0) return;
    setFabricsLoading(true);
    fetch(`/api/fabrics?category=${category}`)
      .then((r) => r.json())
      .then((d) => setFabrics(d.fabrics ?? []))
      .catch(() => setFabrics([]))
      .finally(() => setFabricsLoading(false));
  }, [phase, category, fabrics.length]);

  // Persist (per category) once initialised.
  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(storageKey, JSON.stringify({ selections, measurements, unit, phase, stepIdx, tier, selectedFabric }));
  }, [ready, storageKey, selections, measurements, unit, phase, stepIdx, tier, selectedFabric]);

  function pickFabric(f: Fabric) {
    setSelectedFabric(f);
    setSku(f.sku);
    setPhase(hasTiers ? "tier" : "spec");
  }

  const safeStepIdx = Math.min(stepIdx, Math.max(activeSteps.length - 1, 0));
  const step = activeSteps[safeStepIdx];
  const isLastSpec = safeStepIdx === activeSteps.length - 1;

  function pick(value: string) {
    if (!step) return;
    setSelections((s) => ({ ...s, [step.slug]: value }));
  }

  function setMeasurement(slug: string, value: string) {
    setMeasurements((m) => ({ ...m, [slug]: value }));
  }

  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  // Push the commission into the shared localStorage cart and route to
  // /cart, which handles sign-in, profile completion, and order placement
  // (createOrderFromCart writes the row to mtm_orders).
  function addToCart() {
    if (!selectedFabric) return;
    const tierLabel = hasTiers ? tierObj.name : "Made to measure";
    const categoryNoun = category === "trouser" ? "trousers" : category;
    const lineName = hasTiers
      ? `Bespoke ${categoryNoun} commission — ${tierLabel}`
      : `Made-to-measure ${categoryNoun}`;
    pushToCart({
      sku: `MTM-${category.toUpperCase()}-${Date.now()}`,
      name: lineName,
      type: hasTiers ? `${tierLabel} commission` : "Made-to-measure",
      price: formatBhd(grandTotal),
      priceNum: grandTotal,
      image: selectedFabric.image,
      href: `/customize?category=${category}`,
      custom: {
        category,
        tier: hasTiers ? tier : undefined,
        fabric: selectedFabric.name,
        selections,
        surcharge,
      },
    });
    router.push("/cart");
  }

  // After signing in (incl. returning from Google OAuth) advance the gate to cart.
  useEffect(() => {
    if (phase === "auth" && user) {
      setPhase("cart");
      scrollTop();
    }
  }, [user, phase]);

  function next() {
    if (phase === "tier") {
      setStepIdx(0);
      setPhase("spec");
    } else if (phase === "spec") {
      if (isLastSpec) setPhase("measurements");
      else setStepIdx((i) => i + 1);
    } else if (phase === "measurements") {
      setPhase("summary");
    } else if (phase === "summary") {
      addToCart();
      return;
    }
    scrollTop();
  }

  function back() {
    // From cart, skip past the auth gate if the user is already signed in —
    // otherwise the auth phase auto-bumps them back to cart (infinite no-op).
    if (phase === "cart")              setPhase(user ? "summary" : "auth");
    else if (phase === "auth")         setPhase("summary");
    else if (phase === "summary")      setPhase("measurements");
    else if (phase === "measurements") { setStepIdx(activeSteps.length - 1); setPhase("spec"); }
    else if (phase === "spec") {
      if (safeStepIdx > 0) setStepIdx(safeStepIdx - 1);
      else if (hasTiers) setPhase("tier");
      else if (selectedFabric) setPhase("fabric"); // shirts/trousers: back to fabric pick
    }
    else if (phase === "tier" && selectedFabric) setPhase("fabric");
    scrollTop();
  }

  // Jump straight to a step/phase from the review screen's Edit links.
  function jumpToStep(idx: number) { setStepIdx(idx); setPhase("spec"); scrollTop(); }
  function jumpToPhase(p: Phase)   { setPhase(p); scrollTop(); }

  async function downloadPdf() {
    setDownloading(true);
    try {
      const bytes = await buildSpecPdf(selections, tier, undefined, { measurements, unit, category });
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
    localStorage.removeItem(storageKey);
    setSelections(defaultSelections());
    setMeasurements(defaultMeasurements());
    setUnit("cm");
    setStepIdx(0);
    setSelectedFabric(null);
    setSku(null);
    setPhase("fabric");
    setTier("signature");
    scrollTop();
  }

  const backDisabled =
    phase === "fabric" ||
    (phase === "tier" && !selectedFabric) ||
    (phase === "spec" && safeStepIdx === 0 && !hasTiers && !selectedFabric);
  const copy = CATEGORY_COPY[category];

  // No category in the URL → show the home-style picker tiles so the
  // visitor explicitly chooses what to make. This was the user's brief:
  // "give them the options for everything" (mirror of the home page).
  if (ready && !hasUrlCategory) {
    return <DesignYoursPicker />;
  }

  // The big "Design Your Own" hero only makes sense at the very start
  // (tier picker). Once the user is choosing options or measuring, shrink
  // it to a compact crumb so the controls reach the viewport without scroll.
  // Keep the big "Design Your Own" hero on the entry phases (fabric pick, tier
  // pick). Shrink it once the user is deep in spec/measurement screens.
  const showFullHero = phase === "fabric" || phase === "tier";

  return (
    <div className={`${showFullHero ? "pt-32 md:pt-40" : "pt-24 md:pt-28"} pb-24 min-h-[80vh]`}>
      <div className="container-editorial">

        {/* ── Back to House link ─────────────────────────────────────── */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-eyebrow text-[var(--color-charcoal-500)] hover:text-[var(--color-burgundy-700)] transition-colors mb-6"
        >
          <ArrowLeft size={14} strokeWidth={1.5} />
          The House
        </Link>

        {/* ── Hero / intro ───────────────────────────────────────────── */}
        {showFullHero ? (
          <header className="mb-12 lg:mb-16">
            <span className="text-eyebrow text-[var(--color-burgundy-700)]">Design Yours</span>
            <h1 className="text-display text-[clamp(2.75rem,7vw,6rem)] mt-4 leading-[0.95] text-[var(--color-charcoal-900)]">
              {copy.h1}
            </h1>
            <p className="mt-5 max-w-2xl text-[1rem] text-[var(--color-charcoal-700)] leading-relaxed">
              {copy.intro}
            </p>
          </header>
        ) : (
          <header className="mb-6 flex items-baseline gap-4">
            <span className="text-eyebrow text-[var(--color-burgundy-700)]">Design Yours</span>
            <h1 className="text-display text-[1.5rem] leading-none text-[var(--color-charcoal-900)] hidden md:inline">
              {copy.h1}
            </h1>
          </header>
        )}

        {/* ── Progress dock + top controls ───────────────────────────── */}
        {ready && DESIGN_PHASES.includes(phase) && (
          <>
            <ProgressDock phase={phase} stepIdx={safeStepIdx} stepCount={activeSteps.length} hasTiers={hasTiers} />
            <WizardControls
              phase={phase}
              isLastSpec={isLastSpec}
              backDisabled={backDisabled}
              onBack={back}
              onNext={next}
              className="mt-6"
            />
          </>
        )}

        {/* ── Body ───────────────────────────────────────────────────── */}
        {ready && (
        <AnimatePresence mode="wait">
          {phase === "fabric" && (
            <motion.section
              key="fabric"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="mt-10"
            >
              <FabricPicker
                fabrics={fabrics}
                loading={fabricsLoading}
                selectedSku={selectedFabric?.sku}
                onPick={pickFabric}
              />
            </motion.section>
          )}

          {phase === "spec" && step && (
            <motion.section
              key={`spec-${step.slug}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16"
            >
              <div className="lg:col-span-4">
                <span className="text-eyebrow text-[var(--color-burgundy-700)]">
                  N° {String(safeStepIdx + 1).padStart(2, "0")}
                </span>
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
                  <SelectionsSidebar steps={activeSteps} selections={selections} currentIdx={safeStepIdx} />
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
                groups={activeGroups}
                allActive={activeMeasurements}
                values={measurements}
                unit={unit}
                onSetUnit={setUnit}
                onSetValue={setMeasurement}
              />
            </motion.section>
          )}

          {phase === "tier" && hasTiers && (
            <motion.section
              key="tier"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="mt-12"
            >
              <div className="max-w-3xl">
                <span className="text-eyebrow text-[var(--color-burgundy-700)]">First · Choose Your Commission Tier</span>
                <h2 className="text-display text-[clamp(2.25rem,4vw,3.5rem)] mt-3 leading-[1.05]">
                  One custom garment, three distinct levels of craft.
                </h2>
                <p className="mt-5 text-[1rem] text-[var(--color-charcoal-700)] leading-relaxed">
                  <strong className="font-normal text-[var(--color-charcoal-900)]">Essentials</strong> is the refined foundation of our made-to-measure tailoring.
                  {" "}<strong className="font-normal text-[var(--color-charcoal-900)]">Signature</strong> is the impeccable Hilton house standard.
                  {" "}<strong className="font-normal text-[var(--color-charcoal-900)]">Full Bespoke</strong> is the pinnacle of our art — entirely hand-cut and hand-stitched, with dedicated personal fittings. You&rsquo;ll refine every detail next.
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
                steps={activeSteps}
                groups={activeGroups}
                hasTiers={hasTiers}
                category={category}
                selections={selections}
                measurements={measurements}
                unit={unit}
                tier={tier}
                basePrice={basePrice}
                surcharge={surcharge}
                grandTotal={grandTotal}
                onDownload={downloadPdf}
                downloading={downloading}
                onReset={resetAll}
                onAddToCart={addToCart}
                onEditStep={jumpToStep}
                onEditTier={() => jumpToPhase("tier")}
                onEditMeasurements={() => jumpToPhase("measurements")}
              />
            </motion.section>
          )}

          {phase === "auth" && (
            <motion.section
              key="auth"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="mt-12"
            >
              <AuthPanel
                tier={tier}
                hasTiers={hasTiers}
                category={category}
                selections={selections}
                allSteps={activeSteps}
                basePrice={basePrice}
                surcharge={surcharge}
                grandTotal={grandTotal}
                onBack={back}
                onAuthenticated={() => { setPhase("cart"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              />
            </motion.section>
          )}

          {phase === "cart" && (
            <motion.section
              key="cart"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="mt-12"
            >
              <CartPanel
                tier={tier}
                hasTiers={hasTiers}
                category={category}
                selections={selections}
                allSteps={activeSteps}
                basePrice={basePrice}
                surcharge={surcharge}
                grandTotal={grandTotal}
                onBack={back}
                onKeepDesigning={resetAll}
              />
            </motion.section>
          )}
        </AnimatePresence>
        )}

      </div>
    </div>
  );
}

/* ─────────────────────────── Progress dock ─────────────────────────── */

function ProgressDock({
  phase, stepIdx, stepCount, hasTiers,
}: {
  phase: Phase;
  stepIdx: number;
  stepCount: number;
  hasTiers: boolean;
}) {
  const tierOffset = hasTiers ? 1 : 0;
  // dots = fabric + [tier?] + spec steps + measurements + summary
  const total = 1 + stepCount + tierOffset + 2;
  const currentIndex =
    phase === "fabric"       ? 0 :
    phase === "tier"         ? 1 :
    phase === "spec"         ? 1 + stepIdx + tierOffset :
    phase === "measurements" ? 1 + stepCount + tierOffset :
                                1 + stepCount + tierOffset + 1;
  const label =
    phase === "fabric"       ? "Choose your fabric" :
    phase === "tier"         ? "Commission tier" :
    phase === "spec"         ? `Step ${stepIdx + 1} of ${stepCount}` :
    phase === "measurements" ? "Your measurements" :
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

/* ─────────────────────────── Wizard controls ─────────────────────────── */

function WizardControls({
  phase, isLastSpec, backDisabled, onBack, onNext, className = "",
}: {
  phase: Phase;
  isLastSpec: boolean;
  backDisabled: boolean;
  onBack: () => void;
  onNext: () => void;
  className?: string;
}) {
  const isCart = phase === "summary";
  // Full label for ≥sm, compact label for mobile so it never overflows beside Back.
  const [label, shortLabel] =
    phase === "tier"         ? ["Begin designing", "Begin"] :
    phase === "measurements" ? ["Review specification", "Review"] :
    phase === "summary"      ? ["Add to cart", "Add to cart"] :
    isLastSpec               ? ["Take your measurements", "Measurements"] :
                                ["Next", "Next"];

  const ctaText = "text-[0.72rem] font-medium uppercase tracking-[0.16em] whitespace-nowrap";

  return (
    <nav className={`flex items-center justify-between gap-3 ${className}`}>
      <button
        type="button"
        onClick={onBack}
        disabled={backDisabled}
        className={`${ctaText} inline-flex items-center gap-2 sm:gap-3 border border-[var(--color-charcoal-900)]/30 text-[var(--color-charcoal-900)] px-4 sm:px-6 py-3.5 hover:border-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-700)] transition-colors disabled:opacity-25 disabled:cursor-not-allowed`}
      >
        <ArrowLeft size={16} strokeWidth={1.5} /> Back
      </button>
      <button
        type="button"
        onClick={onNext}
        className={`${ctaText} inline-flex items-center gap-2 sm:gap-3 bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] px-5 sm:px-8 py-3.5 hover:bg-[var(--color-burgundy-800)] transition-colors`}
      >
        {isCart && <ShoppingBag size={16} strokeWidth={1.5} />}
        <span className="sm:hidden">{shortLabel}</span>
        <span className="hidden sm:inline">{label}</span>
        {!isCart && <ArrowRight size={16} strokeWidth={1.5} />}
      </button>
    </nav>
  );
}

/* ─────────────────────────── Option grid ─────────────────────────── */

function OptionGrid({
  step, selected, onPick,
}: {
  step: LiveStep;
  selected: string;
  onPick: (value: string) => void;
}) {
  const kind = step.kind ?? "diagram";
  const cols =
    kind === "choice" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" :
    kind === "swatch" ? "grid-cols-3 sm:grid-cols-4 lg:grid-cols-6" :
                        "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4";

  return (
    <div className={`grid ${cols} gap-3 md:gap-4`}>
      {step.options.map((opt, i) => {
        const active = opt.value === selected;
        const activeBorder = active
          ? "border-[var(--color-burgundy-700)] bg-[var(--color-ivory-200)]"
          : "border-black/10 bg-[var(--color-ivory-100)]";

        // Compact text card — no visual (yes/no & multiple-choice options).
        if (kind === "choice") {
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onPick(opt.value)}
              className={`group relative border transition-all duration-300 hover:border-[var(--color-burgundy-700)] p-6 min-h-[112px] flex flex-col justify-center text-center ${activeBorder}`}
            >
              {active && (
                <span className="absolute top-2.5 right-2.5 inline-flex items-center justify-center w-6 h-6 bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] rounded-full">
                  <Check size={13} strokeWidth={2} />
                </span>
              )}
              <div className={`text-display text-[1.15rem] leading-tight ${active ? "text-[var(--color-burgundy-700)]" : "text-[var(--color-charcoal-900)]"}`}>
                {opt.label}
              </div>
              {opt.note && (
                <div className="text-[0.7rem] text-[var(--color-charcoal-500)] mt-1.5 leading-snug">{opt.note}</div>
              )}
              <div className="text-eyebrow text-[0.65rem] mt-2 text-[var(--color-burgundy-700)]">
                {opt.surcharge && opt.surcharge > 0 ? `+ د.ب ${opt.surcharge}` : "Included"}
              </div>
            </button>
          );
        }

        // Visual tile — diagram | swatch | gallery
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onPick(opt.value)}
            className={`group relative flex flex-col items-center text-left border transition-all duration-300 hover:border-[var(--color-burgundy-700)] ${activeBorder}`}
          >
            <div className="relative w-full aspect-[4/5] overflow-hidden">
              {kind === "diagram" && (
                <Image
                  src={`/customizer/${step.slug}/${opt.value}.png`}
                  alt={opt.label}
                  fill
                  sizes="(min-width: 1024px) 18vw, (min-width: 640px) 30vw, 45vw"
                  loading={i < 4 ? "eager" : "lazy"}
                  className="object-contain p-2.5 md:p-3.5"
                />
              )}
              {kind === "swatch" && (
                <span className="absolute inset-4 rounded-sm border border-black/10" style={{ background: opt.color ?? "#ccc" }} />
              )}
              {kind === "gallery" && (
                opt.image ? (
                  <Image
                    src={opt.image}
                    alt={opt.label}
                    fill
                    sizes="(min-width: 1024px) 18vw, (min-width: 640px) 30vw, 45vw"
                    className="object-contain p-3"
                  />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-eyebrow text-[var(--color-charcoal-500)]">Plain</span>
                )
              )}
              {active && (
                <span className="absolute top-2.5 right-2.5 inline-flex items-center justify-center w-6 h-6 bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] rounded-full">
                  <Check size={13} strokeWidth={2} />
                </span>
              )}
            </div>
            <div className="w-full border-t border-black/5 px-3 py-3 text-center">
              <div className={`text-display text-[0.98rem] leading-tight ${active ? "text-[var(--color-burgundy-700)]" : "text-[var(--color-charcoal-900)]"}`}>
                {opt.label}
              </div>
              {opt.note && (
                <div className="text-[0.7rem] text-[var(--color-charcoal-500)] mt-1 leading-snug">{opt.note}</div>
              )}
              <div className="text-eyebrow text-[0.6rem] mt-1.5 text-[var(--color-burgundy-700)]">
                {opt.surcharge && opt.surcharge > 0 ? `+ د.ب ${opt.surcharge}` : "Included"}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ─────────────────────────── Selections sidebar ─────────────────────────── */

function SelectionsSidebar({ steps, selections, currentIdx }: { steps: LiveStep[]; selections: Selections; currentIdx: number }) {
  // Only show steps the user has already moved past — not future defaults.
  const completed = steps.slice(0, currentIdx);
  if (completed.length === 0) return null;
  return (
    <div className="border-t border-black/10 pt-6">
      <div className="text-eyebrow text-[var(--color-charcoal-500)] mb-4">Your specification so far</div>
      <dl className="space-y-2.5">
        {completed.map((s) => {
          const opt = s.options.find((o) => o.value === selections[s.slug]);
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

/* ─────────────────────────── Fabric picker ─────────────────────────── */

function FabricPicker({
  fabrics, loading, selectedSku, onPick,
}: {
  fabrics: Fabric[];
  loading: boolean;
  selectedSku?: string;
  onPick: (f: Fabric) => void;
}) {
  return (
    <div>
      <div className="max-w-3xl">
        <span className="text-eyebrow text-[var(--color-burgundy-700)]">First · Pick Your Fabric</span>
        <h2 className="text-display text-[clamp(2.25rem,4vw,3.5rem)] mt-3 leading-[1.05]">
          Choose the cloth your garment will be built around.
        </h2>
        <p className="mt-5 text-[1rem] text-[var(--color-charcoal-700)] leading-relaxed">
          Every commission begins with the cloth. Below are the fabrics currently in the house — Italian and Indian
          worsteds, plain weaves and patterns. Pick one and we&rsquo;ll build the rest of the design around it.
        </p>
      </div>

      {loading && (
        <div className="mt-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-10">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[3/4] bg-[var(--color-ivory-200)]" />
              <div className="mt-4 h-3 bg-[var(--color-ivory-200)] w-1/3" />
              <div className="mt-2 h-4 bg-[var(--color-ivory-200)] w-2/3" />
              <div className="mt-2 h-3 bg-[var(--color-ivory-200)] w-1/2" />
            </div>
          ))}
        </div>
      )}

      {!loading && fabrics.length === 0 && (
        <div className="mt-12 border border-black/10 p-8 bg-[var(--color-ivory-200)] max-w-2xl">
          <p className="text-[0.95rem] text-[var(--color-charcoal-700)] leading-relaxed">
            No fabrics for this category yet — the catalogue will populate automatically as soon as the atelier
            adds them in the ERP. In the meantime you can still proceed: we&rsquo;ll use the house default cloth.
          </p>
          <button
            type="button"
            onClick={() =>
              onPick({
                sku: "house-default",
                name: "House cloth",
                brand: "Hilton",
                composition: "",
                pattern: "",
                color: "",
                weight: "",
                origin: "",
                price: "د.ب 0",
                priceNum: 0,
                image: "/products/no-image.svg",
              })
            }
            className="mt-5 text-eyebrow inline-flex items-center gap-3 bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] px-6 py-3 hover:bg-[var(--color-burgundy-800)] transition-colors"
          >
            Continue with house cloth
          </button>
        </div>
      )}

      {!loading && fabrics.length > 0 && (
        <div className="mt-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-10">
          {fabrics.map((f) => {
            const active = f.sku === selectedSku;
            return (
              <button
                key={f.sku}
                type="button"
                onClick={() => onPick(f)}
                className={`group block text-left transition-all duration-300 ${
                  active ? "ring-2 ring-[var(--color-burgundy-700)] ring-offset-2 ring-offset-[var(--color-ivory-100)]" : ""
                }`}
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-[var(--color-ivory-200)] hover-grow">
                  <img
                    src={f.image}
                    alt={`${f.brand} ${f.name}`}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
                <div className="mt-4">
                  <span className="text-eyebrow text-[var(--color-charcoal-500)]">{f.brand}</span>
                  <h3 className="text-display text-[1.25rem] mt-1.5 leading-tight text-[var(--color-charcoal-900)] group-hover:text-[var(--color-burgundy-700)] transition-colors">
                    {f.name}
                  </h3>
                  {f.composition && (
                    <p className="text-[0.8rem] text-[var(--color-charcoal-500)] mt-1">{f.composition}</p>
                  )}
                  <div className="mt-2 flex items-center justify-between gap-2 text-[0.78rem] text-[var(--color-charcoal-700)]">
                    <span>
                      {[f.pattern, f.color, f.weight, f.origin]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </div>
                  {f.gallery && f.gallery.length > 0 && (
                    <div className="mt-3 flex items-center gap-1.5">
                      {f.gallery.slice(0, 3).map((g) => (
                        <div
                          key={g}
                          className="relative w-10 h-10 overflow-hidden bg-[var(--color-ivory-200)]"
                        >
                          <img
                            src={g}
                            alt=""
                            loading="lazy"
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        </div>
                      ))}
                      {f.gallery.length > 3 && (
                        <span className="text-[0.7rem] text-[var(--color-charcoal-500)] tabular-nums ml-1">
                          +{f.gallery.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="mt-3 flex items-center justify-between border-t border-black/10 pt-3">
                    <span className="text-[0.875rem] text-[var(--color-charcoal-900)]">{f.price}</span>
                    <span className="text-eyebrow text-[var(--color-burgundy-700)] group-hover:underline">
                      Choose →
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
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
  groups, allActive, values, unit, onSetUnit, onSetValue,
}: {
  groups: MeasurementGroup[];
  allActive: Measurement[];
  values: MeasurementValues;
  unit: MeasurementUnit;
  onSetUnit: (u: MeasurementUnit) => void;
  onSetValue: (slug: string, value: string) => void;
}) {
  const filledCount = useMemo(
    () => allActive.filter((m) => (values[m.slug] ?? "").trim() !== "").length,
    [values, allActive],
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
      <div className="lg:col-span-4">
        <span className="text-eyebrow text-[var(--color-burgundy-700)]">Measurements</span>
        <h2 className="text-display text-[clamp(2rem,3.5vw,3.25rem)] mt-3 leading-[1.05]">
          Take your measurements.
        </h2>
        <p className="mt-4 text-[1.05rem] text-[var(--color-charcoal-700)] italic">
          A few minutes with a soft tape — {allActive.length} quiet numbers.
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
          {filledCount} of {allActive.length} entered
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

  // Drive playback from visibility: load + play only when the card nears the
  // viewport (rootMargin), pause when it leaves. Keeps mobile from fetching
  // all 14 clips at once and keeps the frame budget light.
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
  steps, groups, hasTiers, category,
  selections, measurements, unit, tier,
  basePrice, surcharge, grandTotal,
  onDownload, downloading, onReset,
  onAddToCart, onEditStep, onEditTier, onEditMeasurements,
}: {
  steps: LiveStep[];
  groups: MeasurementGroup[];
  hasTiers: boolean;
  category: StepCategory;
  selections: Selections;
  measurements: MeasurementValues;
  unit: MeasurementUnit;
  tier: string;
  basePrice: number;
  surcharge: number;
  grandTotal: number;
  onDownload: () => void;
  downloading: boolean;
  onReset: () => void;
  onAddToCart: () => void;
  onEditStep: (idx: number) => void;
  onEditTier: () => void;
  onEditMeasurements: () => void;
}) {
  const tierObj = tiers.find((t) => t.slug === tier) ?? tiers[1];
  const rows = useMemo(
    () => steps.map((s, idx) => ({ step: s, idx, option: s.options.find((o) => o.value === selections[s.slug]) })),
    [selections, steps],
  );
  const activeMeasurements = useMemo(() => groups.flatMap((g) => g.items), [groups]);
  const measurementRows = useMemo(
    () => activeMeasurements
      .map((m) => ({ m, v: (measurements[m.slug] ?? "").trim() }))
      .filter((r) => r.v !== ""),
    [measurements, activeMeasurements],
  );
  const categoryNoun = category === "trouser" ? "trousers" : category;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
      <div className="lg:col-span-7">
        <span className="text-eyebrow text-[var(--color-burgundy-700)]">Specification ready</span>
        <h2 className="text-display text-[clamp(2.5rem,5vw,4.25rem)] mt-3 leading-[1.02]">
          Your bespoke is set.
        </h2>
        <p className="mt-5 max-w-xl text-[1rem] text-[var(--color-charcoal-700)] leading-relaxed">
          Review your specification on the right — tap <span className="text-[var(--color-burgundy-700)]">Edit</span> on
          any line to change just that detail. When you&rsquo;re ready, add it to your cart to proceed to checkout.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={onAddToCart}
            className="text-eyebrow inline-flex items-center justify-center gap-3 bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] px-8 py-4 hover:bg-[var(--color-burgundy-800)] transition-colors"
          >
            <ShoppingBag size={16} strokeWidth={1.5} />
            Add to cart
          </button>
          <button
            type="button"
            onClick={onDownload}
            disabled={downloading}
            className="text-eyebrow inline-flex items-center justify-center gap-3 border border-[var(--color-burgundy-700)] text-[var(--color-burgundy-700)] px-8 py-4 hover:bg-[var(--color-burgundy-700)] hover:text-[var(--color-ivory-100)] transition-colors disabled:opacity-60"
          >
            <Download size={16} strokeWidth={1.5} />
            {downloading ? "Preparing PDF…" : "Download spec"}
          </button>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2">
          <Link
            href="/book"
            className="text-eyebrow text-[var(--color-charcoal-800)] hover:text-[var(--color-burgundy-700)] transition-colors"
          >
            Book a fitting instead
          </Link>
          <button
            type="button"
            onClick={onReset}
            className="text-eyebrow text-[var(--color-charcoal-500)] hover:text-[var(--color-burgundy-700)] transition-colors"
          >
            Start over
          </button>
        </div>
        <p className="mt-6 inline-flex items-center gap-2 text-[0.8rem] text-[var(--color-charcoal-500)]">
          <Lock size={12} strokeWidth={1.5} /> You&rsquo;ll sign in before checkout.
        </p>
      </div>

      <div className="lg:col-span-5 bg-[var(--color-ivory-200)] p-6 sm:p-8 lg:p-10">
        {/* Commission (suits only) or category header */}
        {hasTiers ? (
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-eyebrow text-[var(--color-burgundy-700)] mb-1">Commission</div>
              <div className="text-display text-[2.25rem] text-[var(--color-charcoal-900)] leading-none">{tierObj.name}</div>
              <div className="text-display text-[1.5rem] text-[var(--color-burgundy-700)] mt-1">{tierObj.price}</div>
              <div className="text-[0.8rem] text-[var(--color-charcoal-500)] mt-1">
                {tierObj.lead} · {tierObj.fittings}
              </div>
            </div>
            <EditButton onClick={onEditTier} label="Edit tier" />
          </div>
        ) : (
          <div>
            <div className="text-eyebrow text-[var(--color-burgundy-700)] mb-1">Your {categoryNoun}</div>
            <div className="text-display text-[2rem] text-[var(--color-charcoal-900)] leading-tight capitalize">
              Made to measure
            </div>
            <div className="text-[0.8rem] text-[var(--color-charcoal-500)] mt-1">Priced per specification · 2–3 weeks</div>
          </div>
        )}

        <div className="my-6 h-px bg-black/10" />

        {/* Specification — per-line edit */}
        <div className="text-eyebrow text-[var(--color-burgundy-700)] mb-4">Specification</div>
        <div className="space-y-1">
          {rows.map(({ step, idx, option }) =>
            option ? (
              <button
                key={step.slug}
                type="button"
                onClick={() => onEditStep(idx)}
                className="group w-full flex items-center justify-between gap-3 text-[0.85rem] text-left py-1.5 -mx-2 px-2 hover:bg-[var(--color-ivory-100)] transition-colors"
              >
                <span className="text-[var(--color-charcoal-500)]">{step.title}</span>
                <span className="flex items-center gap-2 text-right">
                  <span className="text-[var(--color-charcoal-900)] group-hover:text-[var(--color-burgundy-700)] transition-colors">
                    {option.label}
                    {option.surcharge > 0 && (
                      <span className="text-[0.72rem] text-[var(--color-burgundy-700)] ml-1.5">+ {formatBhd(option.surcharge)}</span>
                    )}
                  </span>
                  <Pencil size={11} strokeWidth={1.5} className="shrink-0 text-[var(--color-burgundy-700)] opacity-0 group-hover:opacity-100 transition-opacity" />
                </span>
              </button>
            ) : null
          )}
        </div>

        {/* Measurements */}
        <div className="my-6 h-px bg-black/10" />
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="text-eyebrow text-[var(--color-burgundy-700)]">
            Measurements{measurementRows.length > 0 ? ` · ${unit}` : ""}
          </div>
          <EditButton onClick={onEditMeasurements} label="Edit measurements" />
        </div>
        {measurementRows.length > 0 ? (
          <dl className="space-y-3">
            {measurementRows.map(({ m, v }) => (
              <div key={m.slug} className="flex justify-between gap-3 text-[0.85rem]">
                <dt className="text-[var(--color-charcoal-500)]">{m.label}</dt>
                <dd className="text-[var(--color-charcoal-900)] text-right">{v} {unit}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-[0.82rem] text-[var(--color-charcoal-500)] leading-relaxed">
            None entered yet — we&rsquo;ll measure you at the fitting, or tap Edit to add them now.
          </p>
        )}

        {(basePrice > 0 || surcharge > 0) && (
          <>
            <div className="my-6 h-px bg-black/10" />
            <dl className="space-y-2 text-[0.88rem]">
              {basePrice > 0 && (
                <div className="flex justify-between">
                  <dt className="text-[var(--color-charcoal-500)]">{hasTiers ? "Commission" : "Garment"}</dt>
                  <dd className="text-[var(--color-charcoal-900)] tabular-nums">{formatBhd(basePrice)}</dd>
                </div>
              )}
              {surcharge > 0 && (
                <div className="flex justify-between">
                  <dt className="text-[var(--color-charcoal-500)]">Customisation</dt>
                  <dd className="text-[var(--color-burgundy-700)] tabular-nums">+ {formatBhd(surcharge)}</dd>
                </div>
              )}
              <div className="flex justify-between pt-2 mt-1 border-t border-black/10 text-display text-[1.25rem] text-[var(--color-charcoal-900)]">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatBhd(grandTotal)}</dd>
              </div>
            </dl>
          </>
        )}
      </div>
    </div>
  );
}

function EditButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="shrink-0 inline-flex items-center gap-1.5 text-[0.7rem] tracking-[0.18em] uppercase text-[var(--color-burgundy-700)] border border-[var(--color-burgundy-700)]/30 px-3 py-1.5 hover:bg-[var(--color-burgundy-700)] hover:text-[var(--color-ivory-100)] transition-colors"
    >
      <Pencil size={11} strokeWidth={1.5} /> Edit
    </button>
  );
}

/* ─────────────────────────── Sign-in (checkout gate) ─────────────────────────── */

function AuthPanel({
  tier, hasTiers, category, selections, allSteps, surcharge, grandTotal, onBack, onAuthenticated,
}: {
  tier: string;
  hasTiers: boolean;
  category: StepCategory;
  selections: Selections;
  allSteps: LiveStep[];
  basePrice: number;
  surcharge: number;
  grandTotal: number;
  onBack: () => void;
  onAuthenticated: () => void;
}) {
  const tierObj = tiers.find((t) => t.slug === tier) ?? tiers[1];
  const catSteps = allSteps;
  const fit = findLiveOption(allSteps, "fit", selections.fit)?.label ?? "Tailored fit";
  const categoryNoun = category === "trouser" ? "trousers" : category;

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-eyebrow text-[var(--color-charcoal-500)] hover:text-[var(--color-burgundy-700)] transition-colors"
      >
        <ArrowLeft size={14} strokeWidth={1.5} /> Back to review
      </button>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
        {/* Order summary — gives the sign-in context */}
        <div className="bg-[var(--color-ivory-200)] p-7 sm:p-9 order-2 lg:order-1">
          <span className="text-eyebrow text-[var(--color-burgundy-700)]">Checkout · Your order</span>
          <div className="mt-5 flex items-start justify-between gap-4">
            <div>
              <div className="text-display text-[1.5rem] text-[var(--color-charcoal-900)] leading-tight capitalize">
                {hasTiers ? "Bespoke commission" : `Made-to-measure ${categoryNoun}`}
              </div>
              {hasTiers && <div className="text-display text-[1.25rem] text-[var(--color-burgundy-700)] mt-0.5">{tierObj.name}</div>}
            </div>
            {grandTotal > 0 && <div className="text-display text-[1.5rem] text-[var(--color-burgundy-700)] whitespace-nowrap">{formatBhd(grandTotal)}</div>}
          </div>
          <div className="mt-3 text-[0.85rem] text-[var(--color-charcoal-500)] leading-relaxed">
            {fit} · {catSteps.length} details chosen{surcharge > 0 ? `  ·  incl. + ${formatBhd(surcharge)} customisation` : ""}
          </div>
          {hasTiers && (
            <div className="text-[0.8rem] text-[var(--color-charcoal-500)] mt-1">
              {tierObj.lead} · {tierObj.fittings}
            </div>
          )}

          <div className="my-6 h-px bg-black/10" />

          <ul className="space-y-3 text-[0.85rem] text-[var(--color-charcoal-800)]">
            <li className="flex gap-2.5"><Check size={15} strokeWidth={1.5} className="text-[var(--color-burgundy-700)] shrink-0" /> Your specification saved to your account</li>
            <li className="flex gap-2.5"><Check size={15} strokeWidth={1.5} className="text-[var(--color-burgundy-700)] shrink-0" /> Pattern kept on file for life</li>
            <li className="flex gap-2.5"><Check size={15} strokeWidth={1.5} className="text-[var(--color-burgundy-700)] shrink-0" /> Track your commission through the atelier</li>
          </ul>
        </div>

        {/* Sign in */}
        <div className="w-full max-w-md mx-auto lg:mx-0 order-1 lg:order-2">
          <span className="text-eyebrow text-[var(--color-burgundy-700)]">Checkout</span>
          <h2 className="text-display text-[clamp(2rem,4vw,2.75rem)] mt-3 leading-[1.05]">
            Sign in to continue
          </h2>
          <p className="mt-3 mb-7 text-[0.95rem] text-[var(--color-charcoal-700)] leading-relaxed">
            Sign in to save your bespoke and proceed to secure checkout.
          </p>
          <AuthForm onSuccess={onAuthenticated} />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Cart ─────────────────────────── */

function CartPanel({
  tier, hasTiers, category, selections, allSteps, basePrice, surcharge, grandTotal, onBack, onKeepDesigning,
}: {
  tier: string;
  hasTiers: boolean;
  category: StepCategory;
  selections: Selections;
  allSteps: LiveStep[];
  basePrice: number;
  surcharge: number;
  grandTotal: number;
  onBack: () => void;
  onKeepDesigning: () => void;
}) {
  const tierObj = tiers.find((t) => t.slug === tier) ?? tiers[1];
  const catSteps = allSteps;
  const fit = findLiveOption(allSteps, "fit", selections.fit)?.label ?? "Tailored fit";
  const categoryNoun = category === "trouser" ? "trousers" : category;
  const lineTitle = hasTiers ? `Bespoke commission — ${tierObj.name}` : `Made-to-measure ${categoryNoun}`;
  const baseLabel = basePrice > 0 ? formatBhd(basePrice) : "Priced per spec";

  return (
    <div className="max-w-3xl mx-auto">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-eyebrow text-[var(--color-charcoal-500)] hover:text-[var(--color-burgundy-700)] transition-colors"
      >
        <ArrowLeft size={14} strokeWidth={1.5} /> Back
      </button>

      <div className="mt-8">
        <span className="text-eyebrow text-[var(--color-burgundy-700)] inline-flex items-center gap-2">
          <Check size={14} strokeWidth={2} /> Added to your cart
        </span>
        <h2 className="text-display text-[clamp(2.25rem,5vw,3.75rem)] mt-3 leading-[1.03]">
          Ready for checkout.
        </h2>
        <p className="mt-4 max-w-xl text-[1rem] text-[var(--color-charcoal-700)] leading-relaxed">
          Your made-to-measure order is held in your cart. Complete secure payment to begin the make —
          we&rsquo;ll confirm your first fitting by email.
        </p>
      </div>

      {/* Line item */}
      <div className="mt-8 border border-black/10 bg-[var(--color-ivory-100)] p-5 sm:p-6 flex items-start justify-between gap-4">
        <div>
          <div className="text-display text-[1.4rem] sm:text-[1.6rem] text-[var(--color-charcoal-900)] leading-tight capitalize">
            {lineTitle}
          </div>
          <div className="text-[0.85rem] text-[var(--color-charcoal-500)] mt-2">
            {fit} · {catSteps.length} details chosen
          </div>
          {hasTiers && (
            <div className="text-[0.8rem] text-[var(--color-charcoal-500)] mt-1">
              {tierObj.lead} · {tierObj.fittings}
            </div>
          )}
        </div>
        <div className="text-display text-[1.4rem] sm:text-[1.6rem] text-[var(--color-burgundy-700)] whitespace-nowrap">
          {baseLabel}
        </div>
      </div>

      {/* Totals */}
      <div className="mt-6 space-y-2.5">
        <div className="flex justify-between text-[0.9rem] text-[var(--color-charcoal-800)]">
          <span>{hasTiers ? "Commission" : "Garment"}</span><span className="tabular-nums">{baseLabel}</span>
        </div>
        {surcharge > 0 && (
          <div className="flex justify-between text-[0.9rem] text-[var(--color-charcoal-800)]">
            <span>Customisation</span><span className="tabular-nums text-[var(--color-burgundy-700)]">+ {formatBhd(surcharge)}</span>
          </div>
        )}
        <div className="flex justify-between text-[0.9rem] text-[var(--color-charcoal-500)]">
          <span>Fittings &amp; alterations</span><span>Included</span>
        </div>
        <div className="h-px bg-black/10 my-3" />
        <div className="flex justify-between text-display text-[1.35rem] text-[var(--color-charcoal-900)]">
          <span>Total</span><span className="tabular-nums">{basePrice > 0 ? formatBhd(grandTotal) : (surcharge > 0 ? `${formatBhd(surcharge)} + garment` : baseLabel)}</span>
        </div>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          className="flex-1 text-eyebrow inline-flex items-center justify-center gap-3 bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] px-8 py-4 hover:bg-[var(--color-burgundy-800)] transition-colors"
        >
          <Lock size={16} strokeWidth={1.5} /> Proceed to secure payment
        </button>
        <button
          type="button"
          onClick={onKeepDesigning}
          className="text-eyebrow inline-flex items-center justify-center gap-3 border border-[var(--color-burgundy-700)] text-[var(--color-burgundy-700)] px-8 py-4 hover:bg-[var(--color-burgundy-700)] hover:text-[var(--color-ivory-100)] transition-colors"
        >
          Design another
        </button>
      </div>

      <p className="mt-4 flex items-center gap-2 text-[0.8rem] text-[var(--color-charcoal-500)]">
        <Lock size={12} strokeWidth={1.5} /> Secure payment is being integrated — your cart stays saved.
      </p>
    </div>
  );
}
