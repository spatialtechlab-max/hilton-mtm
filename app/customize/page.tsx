"use client";

// useSearchParams triggers Next 15 to opt out of static prerendering for
// this route. Mark it dynamic explicitly so the build doesn't try.
export const dynamic = "force-dynamic";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Download, Sparkles, Ruler, Play, Pause, Pencil, ShoppingBag, Lock, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  tiers, defaultSelections, type Selections,
  defaultMeasurements,
  type MeasurementValues, type MeasurementUnit, type Measurement, type MeasurementGroup,
  type StepCategory, measurementGroupsForCategory,
  categoryHasTiers, tierPriceFor, tierCopy,
} from "@/lib/customizer";
import {
  type LiveStep, fetchLiveSteps, visibleLiveSteps,
  findLiveOption, parsePrice, formatBhd,
} from "@/lib/liveConfig";
import { applyStepOrder } from "@/lib/adminData";
import { fetchAllSettings, defaultFor } from "@/lib/settings";
import { findProduct } from "@/lib/libraries";
import { fetchGarments, fetchGarmentStepCounts } from "@/lib/garments";
import { fetchMyMeasurements } from "@/lib/measurements";
import { buildSpecPdf } from "@/lib/specSheet";
import { AuthForm } from "@/components/AuthForm";
import { useAuth } from "@/components/AuthProvider";
import { addToCart as pushToCart, removeFromCart } from "@/lib/cart";
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
    intro: "A few quiet choices: collar, cuff, and fit, then your measurements. At the end, take your specification with you.",
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
  // When the customer arrives via the cart's "Edit" link, this holds the
  // cart line id being edited. On add-to-cart we remove that line first so
  // the edit REPLACES the item instead of creating a duplicate.
  const [editingCartId, setEditingCartId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  // Steps come ONLY from the database (mtm_steps). No static seed, no merge —
  // so the customizer's step count is exactly what the admin shows. `null`
  // means "still loading"; an empty array after load means the garment has
  // no configured steps.
  const [allSteps, setAllSteps] = useState<LiveStep[] | null>(null);
  const [selections,   setSelections]   = useState<Selections>(defaultSelections);
  const [measurements, setMeasurements] = useState<MeasurementValues>(defaultMeasurements);
  const [unit,         setUnit]         = useState<MeasurementUnit>("cm");
  const [savedMeasurements, setSavedMeasurements] = useState<MeasurementValues | null>(null);
  const [stepIdx, setStepIdx]       = useState(0);
  const [phase, setPhase]           = useState<Phase>("fabric");
  const [tier, setTier]             = useState<string>("signature");
  const [downloading, setDownloading] = useState(false);
  const [fabrics, setFabrics]       = useState<Fabric[]>([]);
  const [fabricsLoading, setFabricsLoading] = useState(false);
  const [selectedFabric, setSelectedFabric] = useState<Fabric | null>(null);
  // Atelier-editable copy (tier lead time + fittings labels). Loaded once
  // on mount; if the row is absent the registry default kicks in via
  // resolveTierCopy(...).
  const [settings, setSettings] = useState<Record<string, string>>({});
  // URL-category routing has three branches:
  //   "valid"           → URL category matches a configurable garment, render the customizer
  //   "not-configurable" → URL category is a known garment row but no customizer steps exist for it yet
  //                       (e.g. admin added "Tuxedo" but hasn't checked any step's applies_to for tuxedo)
  //   "none"            → no/invalid URL category, render the Design Yours picker
  // No silent fallback to suit — per client direction, if a garment isn't
  // configured we say so plainly with a Book a Fitting CTA.
  const [categoryRouting, setCategoryRouting] = useState<"valid" | "not-configurable" | "none">("none");
  const [requestedGarmentLabel, setRequestedGarmentLabel] = useState<string>("");
  const [garmentsList, setGarmentsList] = useState<{ slug: string; label: string; has_tiers: boolean }[]>([]);
  const { user } = useAuth();
  const router = useRouter();
  // useSearchParams gives us a reactive value that re-runs the URL-reading
  // effect whenever a Next.js Link / router.push changes the query string
  // (the default useEffect with [] would have read the URL once on mount
  // only — picking a tile from the Design Yours landing wouldn't propagate).
  const searchParams = useSearchParams();

  const storageKey = `hilton-customizer-${category}`;
  // Tiers are data-driven: the mtm_garments row's has_tiers toggle decides
  // per garment (that's why shoes show no tier picker). The static
  // categoryHasTiers is only the fallback while the table loads.
  const hasTiers   = garmentsList.find((g) => g.slug === category)?.has_tiers
    ?? categoryHasTiers(category);
  const tierObj    = tiers.find((t) => t.slug === tier) ?? tiers[1];

  // Category- and tier-aware config from the live DB config (waistcoat sub-steps conditional)
  // Steps shown for this garment + tier, then ordered by the atelier's
  // per-garment sequence (settings key `step.order.<garment>`); garments
  // with no saved order keep the default sort_order.
  const activeSteps        = useMemo(() => {
    if (!allSteps) return [];   // still loading the DB config
    const steps = visibleLiveSteps(allSteps, category, tier, selections, hasTiers);
    const raw = settings[`step.order.${category}`];
    if (!raw) return steps;
    let order: string[] | null = null;
    try { const p = JSON.parse(raw); if (Array.isArray(p)) order = p.filter((x) => typeof x === "string"); } catch { /* keep default */ }
    return applyStepOrder(steps, order);
  }, [allSteps, category, tier, selections, hasTiers, settings]);
  const activeGroups       = useMemo(() => measurementGroupsForCategory(category), [category]);
  const activeMeasurements = useMemo(() => activeGroups.flatMap((g) => g.items), [activeGroups]);

  // Pricing: every category now uses tier-based pricing, but the tier
  // *price* depends on the category — a Bespoke shirt isn't a Bespoke
  // suit. `tierPriceFor` returns the right BHD label per (cat × tier).
  //
  // For the Essentials tier we mirror the front-end (PDP / library)
  // price of the selected fabric so the number the customer saw on the
  // product card carries straight into the customizer. Signature and
  // Full Bespoke keep their configured baseline (admin-editable later).
  const product           = useMemo(() => (sku ? findProduct(sku) : null), [sku]);
  const essentialOverride = selectedFabric?.priceNum ?? null;
  // Garments without tiers price at the cloth itself (essential), so a
  // tier-less garment never quotes a Signature/Bespoke number.
  const basePrice  = parsePrice(tierPriceFor(category, hasTiers ? tier : "essential", { essentialOverride, settings }));
  // No per-option pricing — the commission price comes entirely from the
  // tier (set in /admin/settings). Individual options never add a surcharge.
  const surcharge: number = 0;
  const grandTotal = basePrice;

  // Atelier-editable copy overrides. Fire-and-forget on mount; falls
  // back to the registry defaults if Supabase is unreachable.
  useEffect(() => {
    fetchAllSettings().then(setSettings).catch(() => setSettings({}));
  }, []);

  // Pull the customizer config straight from Supabase (mtm_steps + active
  // options). No static seed, no merge — the customizer renders exactly the
  // steps the admin configured, so its count matches /admin. If the config
  // can't be read, surface an error rather than falling back to stale code.
  const [stepsError, setStepsError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    fetchLiveSteps()
      .then((payload) => {
        if (cancelled) return;
        if (!payload) { setStepsError(true); setAllSteps([]); return; }
        setAllSteps(payload.steps);
      })
      .catch(() => { if (!cancelled) { setStepsError(true); setAllSteps([]); } });
    return () => { cancelled = true; };
  }, []);

  // Live garment gating: if /admin/garments has the requested slug
  // toggled Hidden, refuse to render the customizer for that category
  // and fall through to the Design Yours picker — same behaviour as
  // arriving with no ?category= at all. Defaults to true while the
  // mtm_garments fetch is in flight so the first paint isn't broken
  // for visitors on Suit/Jacket/Shirt/Trouser.
  const [activeGarmentSlugs, setActiveGarmentSlugs] = useState<Set<string>>(
    () => new Set(["suit", "jacket", "shirt", "trouser"]),
  );
  useEffect(() => {
    let cancelled = false;
    fetchGarments({ activeOnly: true })
      .then((rows) => {
        if (cancelled) return;
        setActiveGarmentSlugs(new Set(rows.map((r) => r.slug)));
        setGarmentsList(rows.map((r) => ({ slug: r.slug, label: r.label, has_tiers: r.has_tiers })));
      })
      .catch(() => { /* keep default */ });
    return () => { cancelled = true; };
  }, []);

  // Pre-fill saved measurements when the customer is signed in. The
  // customizer keeps a per-category localStorage cache, but saved
  // measurements take priority — they're the customer's authoritative
  // tape on file. The customer can still override per-order; we just
  // seed the inputs.
  useEffect(() => {
    if (!user) { setSavedMeasurements(null); return; }
    let cancelled = false;
    fetchMyMeasurements().then((row) => {
      if (cancelled) return;
      if (row?.values) {
        setSavedMeasurements(row.values);
        // Seed live measurements with the saved values, but only for
        // slots the customer hasn't typed into yet. This way refreshes
        // and re-loads don't blow away the customer's in-progress
        // overrides for this commission.
        setMeasurements((prev) => {
          const next = { ...prev };
          for (const [slug, v] of Object.entries(row.values)) {
            if (!next[slug] || next[slug].trim() === "") next[slug] = String(v);
          }
          return next;
        });
        if (row.unit === "cm" || row.unit === "in") setUnit(row.unit);
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [user]);

  // One-time init: read ?category from the URL, then restore that category's saved state.
  // Entry rule: if the URL pre-selects a SKU (came from a PDP "Customise" CTA),
  // skip fabric pick — they already chose one. Otherwise start at "fabric".
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // Accept ?category=, ?garment= and ?cat= so inbound links from any
    // surface resolve — including the cart's Edit deep-link, which uses
    // ?cat= (older cart items already have that baked into their href, so
    // we must keep reading it even though new links use ?category=).
    const raw = params.get("category") ?? params.get("garment") ?? params.get("cat");
    const skuParam = params.get("sku");
    setSku(skuParam);
    // Cart "Edit" deep-link carries the cart line id so re-adding replaces it.
    setEditingCartId(params.get("edit"));
    // Track whether the URL carried a real category. If not, the page
    // renders the Design Yours picker tiles below instead of the
    // customizer. We still set `category` to a safe default so the
    // existing hooks behind the picker keep their types happy.
    // Three branches: a configurable customizer category, a known but
    // not-yet-configured garment (show "book a fitting" empty state), or
    // no/invalid category (show the picker).
    const rawTrim = (raw ?? "").trim();
    // Every Live garment is configurable now: core garments (suit / jacket
    // / shirt / trouser) use their tuned flow, custom garments (overcoat,
    // tuxedo, chinos…) inherit the full step + measurement set. A category
    // that isn't a Live garment falls through to the Design Yours picker.
    const isKnownGarment = !!rawTrim && activeGarmentSlugs.has(rawTrim);
    setCategoryRouting(isKnownGarment ? "valid" : "none");
    if (isKnownGarment) {
      setRequestedGarmentLabel(
        garmentsList.find((g) => g.slug === rawTrim)?.label
          ?? rawTrim.charAt(0).toUpperCase() + rawTrim.slice(1),
      );
    }
    const validUrlCategory = isKnownGarment;
    const cat: StepCategory = (validUrlCategory ? rawTrim : "suit") as StepCategory;
    // Sebastian (the concierge) can pass ?tier=signature etc. We honour it
    // even when it overrides the user's prior saved state, so that picking
    // "Bespoke" in chat truly arrives in the bespoke flow.
    const tierParam = params.get("tier");
    const validTiers = ["essential", "signature", "bespoke"] as const;
    if (tierParam && (validTiers as readonly string[]).includes(tierParam)) {
      setTier(tierParam);
    }
    setCategory(cat);
    // Entry rule: every garment click — whether from the Design Yours picker
    // or a PDP "Customise" CTA — starts the flow at the BEGINNING (cloth →
    // tier → spec → measure → review). We never resume a previously-saved
    // summary/measurements phase, which is what made different garments land
    // on different screens (some on the summary, some mid-flow). The ONLY
    // path that restores a saved session is editing a cart line (?edit=),
    // where the customer is intentionally changing an existing order.
    const editParam = params.get("edit");
    try {
      const saved = JSON.parse(localStorage.getItem(`hilton-customizer-${cat}`) || "null") as null | {
        selections?: Selections; measurements?: MeasurementValues; unit?: MeasurementUnit;
        phase?: Phase; stepIdx?: number; tier?: string; selectedFabric?: Fabric;
      };
      if (saved && editParam) {
        if (saved.selections)   setSelections({ ...defaultSelections(), ...saved.selections });
        if (saved.measurements) setMeasurements({ ...defaultMeasurements(), ...saved.measurements });
        if (saved.unit === "cm" || saved.unit === "in") setUnit(saved.unit);
        if (typeof saved.stepIdx === "number") setStepIdx(saved.stepIdx);
        if (saved.tier)         setTier(saved.tier);
        if (saved.selectedFabric) setSelectedFabric(saved.selectedFabric);
        if (saved.phase && saved.selectedFabric) {
          setPhase(saved.phase);
        } else {
          setPhase("fabric");
        }
      } else {
        // Fresh entry (Design Yours or PDP): clean start at the cloth phase,
        // step 0. The skip-fabric effect picks up ?sku= and advances from
        // "fabric" to tier/spec (tier comes from the URL for suits/jackets).
        setSelections(defaultSelections());
        setStepIdx(0);
        setPhase("fabric");
      }
    } catch {
      setPhase("fabric");
    }
    setReady(true);
    // Re-run on every URL query change (Next Link / router.push) so the
    // page reacts to picking a tile from the Design Yours landing.
    // activeGarmentSlugs is also in deps so the page re-evaluates the
    // gate once /admin/garments has been read (e.g. a Hidden garment
    // arrived via a bookmarked URL).
  }, [searchParams, activeGarmentSlugs]);

  // Accessory guard. A garment with zero customizer steps (tie, belt,
  // shoes, cufflinks…) has nothing to design — if someone lands on
  // /customize?category=<accessory> (a stale link or a hand-typed URL),
  // send them to that garment's library, where each piece adds straight
  // to the cart. Only runs once the category is a confirmed Live garment.
  useEffect(() => {
    if (categoryRouting !== "valid") return;
    let cancelled = false;
    fetchGarmentStepCounts()
      .then((counts) => {
        if (cancelled) return;
        if ((counts[category] ?? 0) === 0) router.replace(`/library/${category}`);
      })
      .catch(() => { /* leave the customizer as-is on failure */ });
    return () => { cancelled = true; };
  }, [categoryRouting, category, router]);

  // Fetch fabrics whenever we land on (or return to) the fabric phase
  // OR the garment category changes. The previous version short-circuited
  // when `fabrics.length > 0` which meant navigating from one garment to
  // another (e.g. /customize?category=shirt → ?category=trouser) left the
  // first garment's cloths on screen.
  useEffect(() => {
    if (phase !== "fabric") return;
    let cancelled = false;
    setFabricsLoading(true);
    setFabrics([]);
    fetch(`/api/fabrics?category=${category}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setFabrics(d.fabrics ?? []); })
      .catch(() => { if (!cancelled) setFabrics([]); })
      .finally(() => { if (!cancelled) setFabricsLoading(false); });
    return () => { cancelled = true; };
  }, [phase, category]);

  // PDP entry shortcut — when the URL carries ?sku=… (visitor clicked
  // 'Customise this jacket' from the library), find that cloth in the
  // freshly-loaded fabric list and skip the fabric phase entirely so
  // the customizer opens straight on the spec steps (or the tier
  // picker for suits/jackets without a pre-chosen tier). The fabric
  // they were looking at on the PDP IS the cloth they want.
  //
  // The ref guard means this only fires once per mount — without it,
  // clicking the in-flow "Change cloth" chip (which sets phase back
  // to "fabric") would immediately bounce the customer right back to
  // the spec step they came from, because sku + fabric still match.
  const autoSkippedFabricRef = useRef(false);
  useEffect(() => {
    if (phase !== "fabric") return;
    if (autoSkippedFabricRef.current) return;
    if (!sku || fabrics.length === 0) return;
    const match = fabrics.find((f) => f.sku === sku);
    if (!match) return;
    autoSkippedFabricRef.current = true;
    setSelectedFabric(match);
    const urlParams = new URLSearchParams(window.location.search);
    const validTiers = ["essential", "signature", "bespoke"] as const;
    const urlHasTier = (validTiers as readonly string[]).includes(urlParams.get("tier") ?? "");
    setPhase(hasTiers && !urlHasTier ? "tier" : "spec");
  }, [phase, sku, fabrics, hasTiers]);

  // Persist (per category) once initialised.
  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(storageKey, JSON.stringify({ selections, measurements, unit, phase, stepIdx, tier, selectedFabric }));
  }, [ready, storageKey, selections, measurements, unit, phase, stepIdx, tier, selectedFabric]);

  function pickFabric(f: Fabric) {
    // Switching cloth mid-flow restarts the spec sequence. Garment
    // style choices (vents, lining weight, fittings count) depend on
    // the cloth, so silently carrying old picks forward would risk a
    // mismatched commission. Per client direction: a new fabric =
    // a fresh start at step 0.
    const isSwitch = selectedFabric !== null && selectedFabric.sku !== f.sku;
    setSelectedFabric(f);
    setSku(f.sku);
    if (isSwitch) {
      setSelections(defaultSelections());
      setMeasurements(defaultMeasurements());
      setStepIdx(0);
      setTier("signature");
    }
    // If a tier was pre-set in the URL (e.g. arriving from a library PDP
    // 'Customise this jacket' CTA which appends &tier=bespoke), skip the
    // tier picker — the customer is already in the full-bespoke flow and
    // should land straight on the spec steps with every booklet option
    // visible.
    const params = new URLSearchParams(window.location.search);
    const validTiers = ["essential", "signature", "bespoke"] as const;
    const urlHasTier = (validTiers as readonly string[]).includes(params.get("tier") ?? "");
    setPhase(hasTiers && !urlHasTier ? "tier" : "spec");
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
    // Editing an existing cart line: drop the old one so the re-add
    // replaces it rather than leaving a duplicate behind.
    if (editingCartId) {
      removeFromCart(editingCartId);
      setEditingCartId(null);
    }
    const tierLabel = hasTiers ? tierObj.name : "Made to measure";
    const categoryNoun = category === "trouser" ? "trousers" : category;
    const lineName = hasTiers
      ? `Bespoke ${categoryNoun} commission · ${tierLabel}`
      : `Made-to-measure ${categoryNoun}`;
    pushToCart({
      sku: `MTM-${category.toUpperCase()}-${Date.now()}`,
      name: lineName,
      type: hasTiers ? `${tierLabel} commission` : "Made-to-measure",
      price: formatBhd(grandTotal),
      priceNum: grandTotal,
      image: selectedFabric.image,
      // Cart Edit deep-link: include the fabric SKU + tier so the
      // customizer lands on the spec phase with the right fabric
      // pre-selected (the skip-fabric effect picks this up).
      href: `/customize?category=${category}&sku=${selectedFabric.sku}${hasTiers ? `&tier=${tier}` : ""}`,
      custom: {
        category,
        tier: hasTiers ? tier : undefined,
        fabric: selectedFabric.name,
        fabricSku: selectedFabric.sku,
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
  // Custom garments (overcoat, tuxedo, chinos…) have no hand-written
  // header copy, so fall back to a label-driven line built from the
  // garment name the atelier set in /admin/garments.
  const copy = CATEGORY_COPY[category] ?? {
    h1: `Your ${(requestedGarmentLabel || category).toLowerCase()}, made to measure.`,
    intro: "Choose your cloth, then the cut and detail of the garment and your measurements. At the end, take your specification with you.",
  };

  // No category in the URL (or an unknown one) → show the home-style
  // picker tiles so the visitor explicitly chooses what to make.
  if (ready && categoryRouting === "none") {
    return <DesignYoursPicker />;
  }

  // Known garment, but no customizer steps configured for it yet. Do NOT
  // silently fall through to the suit flow — show a clean empty state
  // with a Book a Fitting CTA so the customer can still buy. Admin: add
  // this garment to a step's applies_to on /admin to unlock customization.
  if (ready && categoryRouting === "not-configurable") {
    return (
      <div className="pt-32 md:pt-40 pb-24 min-h-[70vh] container-editorial">
        <Link
          href="/customize"
          className="inline-flex items-center gap-2 text-eyebrow text-[var(--color-charcoal-500)] hover:text-[var(--color-burgundy-700)] transition-colors mb-8"
        >
          <ArrowLeft size={14} strokeWidth={1.5} /> Design Yours
        </Link>
        <div className="text-eyebrow text-[var(--color-burgundy-700)]">{requestedGarmentLabel}</div>
        <h1 className="text-display text-[clamp(2rem,4vw,3.25rem)] mt-3 leading-tight max-w-2xl">
          The online customizer for {requestedGarmentLabel.toLowerCase()} commissions isn&rsquo;t open yet.
        </h1>
        <p className="mt-5 max-w-xl text-[1rem] text-[var(--color-charcoal-700)] leading-relaxed">
          The atelier is still building the options for this garment. In the meantime, book a
          fitting and the master tailor will take you through cloth, cut, and measurements in
          person at the house.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {/* Book a fitting hidden per atelier request (code kept). */}
          <Link
            href="/book"
            className="hidden items-center gap-2 bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] px-6 py-4 hover:bg-[var(--color-burgundy-800)] transition-colors"
          >
            Book a fitting <ArrowRight size={14} strokeWidth={1.5} />
          </Link>
          <Link
            href="/contact"
            className="text-eyebrow inline-flex items-center gap-2 border border-[var(--color-burgundy-700)] text-[var(--color-burgundy-700)] px-6 py-4 hover:bg-[var(--color-burgundy-700)] hover:text-[var(--color-ivory-100)] transition-colors"
          >
            Contact the atelier
          </Link>
        </div>
      </div>
    );
  }

  // Steps load from the DB only — no static fallback. If the config genuinely
  // can't be read, say so plainly instead of rendering a stale code-seeded flow.
  if (ready && categoryRouting === "valid" && stepsError) {
    return (
      <div className="pt-32 md:pt-40 pb-24 min-h-[70vh] container-editorial">
        <Link
          href="/customize"
          className="inline-flex items-center gap-2 text-eyebrow text-[var(--color-charcoal-500)] hover:text-[var(--color-burgundy-700)] transition-colors mb-8"
        >
          <ArrowLeft size={14} strokeWidth={1.5} /> Design Yours
        </Link>
        <h1 className="text-display text-[clamp(2rem,4vw,3.25rem)] mt-3 leading-tight max-w-2xl">
          We couldn&rsquo;t load the customizer right now.
        </h1>
        <p className="mt-5 max-w-xl text-[1rem] text-[var(--color-charcoal-700)] leading-relaxed">
          Please refresh in a moment, or come back shortly.
        </p>
      </div>
    );
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

        {/* Cloth chip — visible on every non-fabric phase so the customer
            can jump back to the fabric pick without clicking Back through
            every spec step. Switching to a different fabric resets the
            spec sequence (handled in pickFabric). */}
        {!showFullHero && selectedFabric && (
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 border border-black/10 bg-[var(--color-ivory-200)] px-3 py-1.5">
              <span className="text-[0.6rem] tracking-[0.18em] uppercase text-[var(--color-charcoal-500)]">Cloth</span>
              <span className="text-[0.82rem] text-[var(--color-charcoal-900)]">
                {[selectedFabric.brand, selectedFabric.name].filter(Boolean).join(" · ")}
              </span>
              {selectedFabric.price && (
                <span className="text-[0.78rem] text-[var(--color-burgundy-700)] tabular-nums">
                  {selectedFabric.price}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setPhase("fabric")}
              className="text-[0.62rem] tracking-[0.18em] uppercase inline-flex items-center gap-1.5 border border-[var(--color-burgundy-700)] text-[var(--color-burgundy-700)] px-3 py-1.5 hover:bg-[var(--color-burgundy-700)] hover:text-[var(--color-ivory-100)] transition-colors"
            >
              <Pencil size={11} strokeWidth={1.5} /> Change cloth
            </button>
          </div>
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

              <TierPicker
                tier={tier}
                onPick={setTier}
                category={category}
                essentialOverride={essentialOverride}
                settings={settings}
              />
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
                essentialOverride={essentialOverride}
                settings={settings}
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
                settings={settings}
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
                settings={settings}
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
  // During the spec walk, show exactly stepCount bars so the count
  // matches the 'Step 1 of N' label. The earlier multi-phase bar
  // (fabric + tier + spec + measurements + summary) drifted out of
  // sync with the label, showing two filled bars on step 1 because
  // the fabric tick had already been carried forward. Outside of
  // spec we still surface the multi-phase progress.
  const tierOffset = hasTiers ? 1 : 0;
  const total =
    phase === "spec" ? stepCount : 1 + stepCount + tierOffset + 2;
  const currentIndex =
    phase === "fabric"       ? 0 :
    phase === "tier"         ? 1 :
    phase === "spec"         ? stepIdx :
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

        // Compact text card — used for yes/no and multiple-choice
        // options that don't have a diagram. If the atelier uploaded a
        // custom image via /admin (image_url -> opt.image) we promote
        // this from text-only to an image-bearing tile so the upload
        // actually reaches the customer.
        if (kind === "choice") {
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onPick(opt.value)}
              className={`group relative border transition-all duration-300 hover:border-[var(--color-burgundy-700)] ${
                opt.image ? "" : "p-6 min-h-[112px] flex flex-col justify-center"
              } text-center ${activeBorder}`}
            >
              {active && (
                <span className="absolute top-2.5 right-2.5 z-10 inline-flex items-center justify-center w-6 h-6 bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] rounded-full">
                  <Check size={13} strokeWidth={2} />
                </span>
              )}
              {opt.image && (
                <div className="relative w-full aspect-[4/5] overflow-hidden">
                  <Image
                    src={opt.image}
                    alt={opt.label}
                    fill
                    sizes="(min-width: 1024px) 18vw, (min-width: 640px) 30vw, 45vw"
                    loading={i < 4 ? "eager" : "lazy"}
                    className="object-contain p-2.5 md:p-3.5"
                  />
                </div>
              )}
              <div className={opt.image ? "px-4 pt-3 pb-4" : ""}>
                <div className={`text-display text-[1.15rem] leading-tight ${active ? "text-[var(--color-burgundy-700)]" : "text-[var(--color-charcoal-900)]"}`}>
                  {opt.label}
                </div>
                {opt.note && (
                  <div className="text-[0.7rem] text-[var(--color-charcoal-500)] mt-1.5 leading-snug">{opt.note}</div>
                )}
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
                <OptionDiagram
                  src={opt.image ?? `/customizer/${step.slug}/${opt.value}.png`}
                  alt={opt.label}
                  eager={i < 4}
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
  // Lightbox: when a fabric thumbnail is clicked, open the full image
  // gallery (swatch + on-form garment + back + detail) so the customer
  // can inspect the cloth and the garment-on-form properly. Same idea
  // as the library PDP carousel, scoped to one fabric at a time.
  const [lightbox, setLightbox] = useState<
    | { fabric: Fabric; index: number }
    | null
  >(null);
  useEffect(() => {
    if (!lightbox) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight") {
        setLightbox((s) => {
          if (!s) return s;
          const list = [s.fabric.image, ...(s.fabric.gallery ?? [])].filter(
            (v, i, a) => v && a.indexOf(v) === i,
          );
          return { ...s, index: (s.index + 1) % list.length };
        });
      }
      if (e.key === "ArrowLeft") {
        setLightbox((s) => {
          if (!s) return s;
          const list = [s.fabric.image, ...(s.fabric.gallery ?? [])].filter(
            (v, i, a) => v && a.indexOf(v) === i,
          );
          return { ...s, index: (s.index - 1 + list.length) % list.length };
        });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox]);

  return (
    <div>
      <div className="max-w-3xl">
        <span className="text-eyebrow text-[var(--color-burgundy-700)]">First · Pick Your Fabric</span>
        <h2 className="text-display text-[clamp(2.25rem,4vw,3.5rem)] mt-3 leading-[1.05]">
          Choose the cloth your garment will be built around.
        </h2>
        <p className="mt-5 text-[1rem] text-[var(--color-charcoal-700)] leading-relaxed">
          Every commission begins with the cloth. Below are the fabrics currently in the house: Italian and Indian
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
            No fabrics for this category yet. The catalogue will populate automatically as soon as the atelier
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
                price: "BHD 0",
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
            // Build the per-fabric gallery (cloth swatch first, then on-form
            // garment shots) once so the lightbox + thumbnail strip stay in
            // sync. De-duplicate so identical entries don't show twice.
            const allShots = [f.image, ...(f.gallery ?? [])].filter(
              (v, i, a) => v && a.indexOf(v) === i,
            );
            return (
              <div
                key={f.sku}
                role="group"
                aria-label={`${f.brand} ${f.name}`}
                className={`group block text-left transition-all duration-300 ${
                  active ? "ring-2 ring-[var(--color-burgundy-700)] ring-offset-2 ring-offset-[var(--color-ivory-100)]" : ""
                }`}
              >
                <button
                  type="button"
                  onClick={() => setLightbox({ fabric: f, index: 0 })}
                  aria-label={`Enlarge ${f.brand} ${f.name}`}
                  className="relative w-full aspect-[3/4] overflow-hidden bg-[var(--color-ivory-200)] hover-grow block cursor-zoom-in"
                >
                  <img
                    src={f.image}
                    alt={`${f.brand} ${f.name}`}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </button>
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
                      {f.gallery.slice(0, 3).map((g, gi) => {
                        // Thumbnail index inside the de-duplicated gallery —
                        // +1 to skip the cloth swatch which is index 0 in
                        // allShots.
                        const idx = allShots.indexOf(g);
                        return (
                          <button
                            key={g}
                            type="button"
                            onClick={() => setLightbox({ fabric: f, index: idx >= 0 ? idx : gi + 1 })}
                            aria-label={`Enlarge photo ${gi + 1} of ${f.name}`}
                            className="relative w-10 h-10 overflow-hidden bg-[var(--color-ivory-200)] cursor-zoom-in hover:ring-1 hover:ring-[var(--color-burgundy-700)] transition-all"
                          >
                            <img
                              src={g}
                              alt=""
                              loading="lazy"
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                          </button>
                        );
                      })}
                      {f.gallery.length > 3 && (
                        <button
                          type="button"
                          onClick={() => setLightbox({ fabric: f, index: 4 })}
                          className="text-[0.7rem] text-[var(--color-charcoal-500)] tabular-nums ml-1 hover:text-[var(--color-burgundy-700)] transition-colors"
                        >
                          +{f.gallery.length - 3}
                        </button>
                      )}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => onPick(f)}
                    className="w-full mt-3 flex items-center justify-between border-t border-black/10 pt-3 hover:text-[var(--color-burgundy-700)] transition-colors"
                  >
                    <span className="text-[0.875rem] text-[var(--color-charcoal-900)]">{f.price}</span>
                    <span className="text-eyebrow text-[var(--color-burgundy-700)] group-hover:underline">
                      Choose →
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox — large hero photo + thumbnail strip + a single
          'Choose this cloth' CTA so the customer can commit straight
          from the enlarged view. */}
      {lightbox && (
        <FabricLightbox
          fabric={lightbox.fabric}
          index={lightbox.index}
          onIndex={(i) => setLightbox((s) => (s ? { ...s, index: i } : s))}
          onClose={() => setLightbox(null)}
          onPick={(f) => { setLightbox(null); onPick(f); }}
        />
      )}
    </div>
  );
}

function FabricLightbox({
  fabric, index, onIndex, onClose, onPick,
}: {
  fabric: Fabric;
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
  onPick: (f: Fabric) => void;
}) {
  const shots = [fabric.image, ...(fabric.gallery ?? [])].filter(
    (v, i, a) => v && a.indexOf(v) === i,
  );
  const safeIndex = Math.min(Math.max(index, 0), shots.length - 1);
  const current = shots[safeIndex];
  // Build the PDP-style detail rows from the fabric record. Missing
  // values surface explicitly (per the ERP audit pass) so the atelier
  // sees gaps even from the customer-facing lightbox.
  const categoryLabel = fabric.erpCategory
    ? fabric.erpCategory.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
    : "";
  const detailRows: { label: string; value: string }[] = [
    { label: "Style",       value: categoryLabel },
    { label: "Brand",       value: fabric.brand },
    { label: "Composition", value: fabric.composition },
    { label: "Pattern",     value: fabric.pattern },
    { label: "Color",       value: fabric.color },
    { label: "Shade",       value: fabric.shade ?? "" },
    { label: "Weight",      value: fabric.weight },
    { label: "Size",        value: fabric.size ?? "" },
    { label: "Origin",      value: fabric.origin },
    { label: "Style code",  value: fabric.code ?? "" },
    { label: "SKU",         value: fabric.sku },
  ].filter((r) => r.value);
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${fabric.brand} ${fabric.name}`}
      className="fixed inset-0 z-[60] bg-[var(--color-charcoal-900)]/92 backdrop-blur-sm flex items-center justify-center p-4 md:p-10"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-6xl bg-[var(--color-ivory-100)] overflow-hidden grid grid-cols-1 md:grid-cols-12 max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close enlarged view"
          className="absolute top-3 right-3 z-10 inline-flex items-center justify-center w-10 h-10 bg-[var(--color-ivory-100)]/90 hover:bg-[var(--color-burgundy-700)] hover:text-[var(--color-ivory-100)] rounded-full transition-colors"
        >
          <X size={18} strokeWidth={1.5} />
        </button>

        {/* Image column — sized to the viewport so the thumbnail strip
            never falls below the fold. Image area flexes to fill the
            remaining height after the strip claims its space. */}
        <div className="md:col-span-7 bg-[var(--color-ivory-200)] flex flex-col md:h-[88vh] md:max-h-[88vh]">
          <div className="relative aspect-[4/5] md:aspect-auto md:flex-1 md:min-h-0">
            <img
              src={current}
              alt={`${fabric.brand} ${fabric.name}`}
              className="absolute inset-0 w-full h-full object-contain"
            />
            {shots.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => onIndex((safeIndex - 1 + shots.length) % shots.length)}
                  aria-label="Previous photo"
                  className="absolute left-3 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-11 h-11 bg-[var(--color-ivory-100)]/90 hover:bg-[var(--color-burgundy-700)] hover:text-[var(--color-ivory-100)] rounded-full transition-colors"
                >
                  <ArrowLeft size={18} strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  onClick={() => onIndex((safeIndex + 1) % shots.length)}
                  aria-label="Next photo"
                  className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-11 h-11 bg-[var(--color-ivory-100)]/90 hover:bg-[var(--color-burgundy-700)] hover:text-[var(--color-ivory-100)] rounded-full transition-colors"
                >
                  <ArrowRight size={18} strokeWidth={1.5} />
                </button>
              </>
            )}
          </div>
          {/* Thumbnail strip — pinned to the bottom of the image column
              and inside the viewport-sized parent above, so it's always
              visible without scrolling. */}
          <div className="md:shrink-0 px-4 md:px-5 py-3 flex items-center gap-2 overflow-x-auto bg-[var(--color-ivory-100)] border-t border-black/10">
            {shots.map((s, i) => {
              const active = i === safeIndex;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => onIndex(i)}
                  aria-label={`View photo ${i + 1} of ${shots.length}`}
                  className={`relative shrink-0 w-16 h-20 overflow-hidden bg-[var(--color-ivory-200)] transition-all ${
                    active
                      ? "ring-2 ring-[var(--color-burgundy-700)] ring-offset-2 ring-offset-[var(--color-ivory-100)]"
                      : "opacity-70 hover:opacity-100"
                  }`}
                >
                  <img
                    src={s}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </button>
              );
            })}
            <span className="ml-auto text-[0.65rem] tracking-[0.15em] uppercase text-[var(--color-charcoal-500)] tabular-nums whitespace-nowrap">
              {safeIndex + 1} / {shots.length}
            </span>
          </div>
        </div>

        {/* Info column — PDP-style: type eyebrow, name, composition,
            price, primary CTA, then the Details spec table. Scrolls
            independently if the spec list grows past the viewport so
            the image column on the left stays pinned in place. */}
        <div className="md:col-span-5 p-7 md:p-10 flex flex-col md:h-[88vh] md:max-h-[88vh] md:overflow-y-auto">
          <span className="text-eyebrow text-[var(--color-burgundy-700)]">
            {fabric.erpCategory
              ? fabric.erpCategory.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
              : "Cloth"}
          </span>
          <h3 className="text-display text-[clamp(1.75rem,3vw,2.5rem)] mt-3 leading-tight">{fabric.name}</h3>
          {fabric.composition && (
            <p className="mt-2 text-[0.9rem] text-[var(--color-charcoal-500)]">{fabric.composition}</p>
          )}
          <div className="text-display text-[1.75rem] text-[var(--color-burgundy-700)] mt-5">
            {fabric.price}
          </div>
          <button
            type="button"
            onClick={() => onPick(fabric)}
            className="mt-6 text-eyebrow inline-flex items-center justify-center gap-2 bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] px-6 py-3.5 hover:bg-[var(--color-burgundy-800)] transition-colors"
          >
            <Sparkles size={14} strokeWidth={1.5} />
            Choose this cloth
            <ArrowRight size={14} strokeWidth={1.5} />
          </button>
          {detailRows.length > 0 && (
            <div className="mt-8 pt-6 border-t border-black/10">
              <span className="text-eyebrow text-[var(--color-burgundy-700)]">Details</span>
              <dl className="mt-4 border-t border-black/10">
                {detailRows.map((row) => {
                  const missing = row.value === "Missing value";
                  return (
                    <div key={row.label} className="flex items-start justify-between gap-6 py-2.5 border-b border-black/10">
                      <dt className="text-[0.7rem] tracking-[0.12em] uppercase text-[var(--color-charcoal-500)]">{row.label}</dt>
                      <dd className={`text-[0.85rem] text-right ${missing ? "italic text-[var(--color-burgundy-700)]/70" : "text-[var(--color-charcoal-900)]"}`}>{row.value}</dd>
                    </div>
                  );
                })}
              </dl>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

/* ─────────────────────────── Tier picker ─────────────────────────── */

function TierPicker({
  tier, onPick, category, essentialOverride, settings,
}: {
  tier: string;
  onPick: (slug: string) => void;
  category: StepCategory;
  essentialOverride: number | null;
  settings: Record<string, string>;
}) {
  return (
    <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-6">
      {tiers.map((t) => {
        const active = t.slug === tier;
        const priceLabel = tierPriceFor(category, t.slug, { essentialOverride, settings });
        // Editorial copy — resolved per garment first (the generated
        // "Tier copy — <Garment>" settings group), then the shared Tier
        // copy group, then the hardcoded default. The features setting is
        // a single string with one bullet per line; empty lines are
        // filtered out so the atelier can leave blank lines while drafting.
        const leadLabel     = tierCopy(settings, "lead", t.slug, category) ?? t.lead;
        const fittingsLabel = tierCopy(settings, "fittings", t.slug, category) ?? t.fittings;
        const nameLabel     = tierCopy(settings, "name", t.slug, category) ?? t.name;
        const taglineLabel  = tierCopy(settings, "tagline", t.slug, category) ?? t.tagline;
        const featuresRaw   = tierCopy(settings, "features", t.slug, category);
        const featuresList = (featuresRaw === undefined
          ? t.features
          : featuresRaw.split("\n").map((s) => s.trim()).filter(Boolean));
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
            <div className="text-eyebrow text-[var(--color-burgundy-700)]">{taglineLabel}</div>
            <h3 className="text-display text-[clamp(2rem,3.2vw,3rem)] mt-3 text-[var(--color-charcoal-900)]">
              {nameLabel}
            </h3>
            <div className="text-display text-[1.85rem] mt-2 text-[var(--color-burgundy-700)]">{priceLabel}</div>
            <div className="mt-3 text-[0.85rem] text-[var(--color-charcoal-500)]">
              {leadLabel} · {fittingsLabel}
            </div>
            <ul className="mt-6 space-y-2 text-[0.9rem] text-[var(--color-charcoal-800)] leading-relaxed">
              {featuresList.map((f) => (
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
          A few minutes with a soft tape, {allActive.length} quiet numbers.
        </p>
        <p className="mt-5 text-[0.95rem] text-[var(--color-charcoal-700)] leading-relaxed">
          Each clip is a short loop showing precisely how the tape should sit. Take what you can; anything you skip,
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

        {/* "Prefer in-person? Book a fitting" card hidden per atelier request (code kept). */}
        <div className="hidden mt-10 p-6 border border-black/10 bg-[var(--color-ivory-200)]">
          <div className="text-eyebrow text-[var(--color-burgundy-700)] mb-2">Prefer in-person?</div>
          <p className="text-[0.9rem] text-[var(--color-charcoal-800)] leading-relaxed">
            Skip ahead and book a fitting; the master tailor will take every measurement at the atelier.
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
  essentialOverride, settings,
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
  essentialOverride: number | null;
  settings: Record<string, string>;
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
          Review your specification on the right. Tap <span className="text-[var(--color-burgundy-700)]">Edit</span> on
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
          {/* Book a fitting hidden per atelier request (code kept). */}
          <Link
            href="/book"
            className="hidden text-[var(--color-charcoal-800)] hover:text-[var(--color-burgundy-700)] transition-colors"
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

        {/* Total — kept on the LEFT next to the buttons so the customer sees
            the price immediately, without scrolling past the spec list. */}
        {(basePrice > 0 || surcharge > 0) && (
          <div className="mt-10 max-w-md border-t border-black/10 pt-6">
            <dl className="space-y-2 text-[0.9rem]">
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
              <div className="flex justify-between pt-2 mt-1 border-t border-black/10 text-display text-[1.5rem] text-[var(--color-charcoal-900)]">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatBhd(grandTotal)}</dd>
              </div>
            </dl>
          </div>
        )}

        {/* Measurements — also on the LEFT, in a compact two-column grid so the
            full set is visible at a glance instead of a long vertical scroll. */}
        <div className="mt-8 max-w-xl">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="text-eyebrow text-[var(--color-burgundy-700)]">
              Measurements{measurementRows.length > 0 ? ` · ${unit}` : ""}
            </div>
            <EditButton onClick={onEditMeasurements} label="Edit measurements" />
          </div>
          {measurementRows.length > 0 ? (
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-3">
              {measurementRows.map(({ m, v }) => (
                <div key={m.slug} className="flex justify-between gap-3 text-[0.85rem] border-b border-black/5 pb-2">
                  <dt className="text-[var(--color-charcoal-500)]">{m.label}</dt>
                  <dd className="text-[var(--color-charcoal-900)] text-right whitespace-nowrap">{v} {unit}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-[0.82rem] text-[var(--color-charcoal-500)] leading-relaxed max-w-md">
              None entered yet. We&rsquo;ll measure you at the fitting, or tap Edit to add them now.
            </p>
          )}
        </div>
      </div>

      <div className="lg:col-span-5 bg-[var(--color-ivory-200)] p-6 sm:p-8 lg:p-10">
        {/* Commission (suits only) or category header */}
        {hasTiers ? (
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-eyebrow text-[var(--color-burgundy-700)] mb-1">Commission</div>
              <div className="text-display text-[2.25rem] text-[var(--color-charcoal-900)] leading-none">{tierObj.name}</div>
              <div className="text-display text-[1.5rem] text-[var(--color-burgundy-700)] mt-1">{tierPriceFor(category, tier, { essentialOverride, settings })}</div>
              <div className="text-[0.8rem] text-[var(--color-charcoal-500)] mt-1">
                {tierCopy(settings, "lead", tier, category) ?? tierObj.lead} · {tierCopy(settings, "fittings", tier, category) ?? tierObj.fittings}
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
                  </span>
                  <Pencil size={11} strokeWidth={1.5} className="shrink-0 text-[var(--color-burgundy-700)] opacity-0 group-hover:opacity-100 transition-opacity" />
                </span>
              </button>
            ) : null
          )}
        </div>

      </div>
    </div>
  );
}

/**
 * Customizer option diagram with a graceful fallback. When an admin
 * adds a new option in /admin without uploading its illustration, the
 * default /customizer/<slug>/<value>.png file doesn't exist and Image
 * would just render an alt-text-only broken tile. Swap in the
 * no-image placeholder on error so the customer never sees that.
 */
function OptionDiagram({ src, alt, eager }: { src: string; alt: string; eager: boolean }) {
  const [resolved, setResolved] = useState(src);
  useEffect(() => { setResolved(src); }, [src]);
  return (
    <Image
      src={resolved}
      alt={alt}
      fill
      sizes="(min-width: 1024px) 18vw, (min-width: 640px) 30vw, 45vw"
      loading={eager ? "eager" : "lazy"}
      className="object-contain p-2.5 md:p-3.5"
      onError={() => setResolved("/products/no-image.svg")}
    />
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
  tier, hasTiers, category, selections, allSteps, surcharge, grandTotal, settings, onBack, onAuthenticated,
}: {
  tier: string;
  hasTiers: boolean;
  category: StepCategory;
  selections: Selections;
  allSteps: LiveStep[];
  basePrice: number;
  surcharge: number;
  grandTotal: number;
  settings: Record<string, string>;
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
              {tierCopy(settings, "lead", tier, category) ?? tierObj.lead} · {tierCopy(settings, "fittings", tier, category) ?? tierObj.fittings}
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
  tier, hasTiers, category, selections, allSteps, basePrice, surcharge, grandTotal, settings, onBack, onKeepDesigning,
}: {
  tier: string;
  hasTiers: boolean;
  category: StepCategory;
  selections: Selections;
  allSteps: LiveStep[];
  basePrice: number;
  surcharge: number;
  grandTotal: number;
  settings: Record<string, string>;
  onBack: () => void;
  onKeepDesigning: () => void;
}) {
  const tierObj = tiers.find((t) => t.slug === tier) ?? tiers[1];
  const catSteps = allSteps;
  const fit = findLiveOption(allSteps, "fit", selections.fit)?.label ?? "Tailored fit";
  const categoryNoun = category === "trouser" ? "trousers" : category;
  const lineTitle = hasTiers ? `Bespoke commission · ${tierObj.name}` : `Made-to-measure ${categoryNoun}`;
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
          Your made-to-measure order is held in your cart. Complete secure payment to begin the make;
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
              {tierCopy(settings, "lead", tier, category) ?? tierObj.lead} · {tierCopy(settings, "fittings", tier, category) ?? tierObj.fittings}
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
        <Lock size={12} strokeWidth={1.5} /> Secure payment is being integrated; your cart stays saved.
      </p>
    </div>
  );
}
