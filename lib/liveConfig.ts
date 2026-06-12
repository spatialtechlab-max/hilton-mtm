import { supabase, isSupabaseConfigured } from "./supabase";
import {
  getSeedConfig, tierRank, categoryHasTiers, isCoreCategory,
  type StepCategory, type TierLevel, type StepKind, type Selections,
} from "./customizer";

/**
 * Live customization config — read from Supabase so the admin's edits (options,
 * labels, colours, images, surcharges) drive the storefront. Falls back to the
 * static code config when the DB is empty or unreachable.
 */

export type LiveOption = {
  value: string;
  label: string;
  note: string | null;
  color: string | null;
  image: string | null;
  surcharge: number;
};

export type LiveStep = {
  slug: string;
  title: string;
  eyebrow: string;
  subtitle: string;
  description: string;
  kind: StepKind;
  appliesTo: StepCategory[];
  tier: TierLevel | null;
  requiresSlug: string | null;
  requiresValue: string | null;
  options: LiveOption[];
};

/** Build the config from the static code (fallback / SSR-safe default). */
export function staticLiveSteps(): LiveStep[] {
  return getSeedConfig().map((s) => ({
    slug: s.slug,
    title: s.title,
    eyebrow: s.eyebrow,
    subtitle: s.subtitle,
    description: s.description,
    kind: s.kind,
    appliesTo: s.appliesTo,
    tier: s.tier,
    requiresSlug: s.requiresSlug,
    requiresValue: s.requiresValue,
    options: s.options.map((o) => ({
      value: o.value, label: o.label, note: o.note, color: o.color, image: o.image, surcharge: o.surcharge ?? 0,
    })),
  }));
}

type StepRow = {
  slug: string; title: string; eyebrow: string | null; subtitle: string | null;
  description: string | null; kind: string | null; applies_to: string[] | null;
  tier: string | null; requires_slug: string | null; requires_value: string | null;
};
type OptionRow = {
  step_slug: string; value: string; label: string; note: string | null;
  color: string | null; image_url: string | null; surcharge: number | string | null;
};

/** Result of pulling the admin config from Supabase. */
export type LiveConfigPayload = {
  /** Live, active steps with their active options (admin overrides applied). */
  steps: LiveStep[];
  /** Step slugs explicitly disabled in DB (so the customizer can drop them). */
  disabledStepSlugs: Set<string>;
  /** Step→Set of option values that are explicitly disabled in DB. */
  disabledOptionsByStep: Record<string, Set<string>>;
};

/** Read the config from Supabase. Returns null if empty/unreachable.
 * Pulls ALL rows (active + inactive) so callers can distinguish
 * "missing from DB" (use static fallback) from "explicitly disabled" (hide). */
export async function fetchLiveSteps(): Promise<LiveConfigPayload | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const [stepsRes, optsRes] = await Promise.all([
      supabase.from("mtm_steps").select("*").order("sort_order"),
      supabase.from("mtm_options").select("*").order("sort_order"),
    ]);
    const stepRows = (stepsRes.data as (StepRow & { active: boolean })[] | null);
    if (stepsRes.error || optsRes.error || !stepRows || stepRows.length === 0) return null;
    const activeSteps = stepRows.filter((s) => s.active !== false);
    const disabledStepSlugs = new Set(stepRows.filter((s) => s.active === false).map((s) => s.slug));

    const byStep: Record<string, LiveOption[]> = {};
    const disabledOptionsByStep: Record<string, Set<string>> = {};
    for (const o of (optsRes.data as (OptionRow & { active: boolean })[] | null) ?? []) {
      if (o.active === false) {
        (disabledOptionsByStep[o.step_slug] ??= new Set()).add(o.value);
        continue;
      }
      (byStep[o.step_slug] ??= []).push({
        value: o.value, label: o.label, note: o.note,
        color: o.color, image: o.image_url, surcharge: Number(o.surcharge) || 0,
      });
    }
    const steps = activeSteps.map((s) => ({
      slug: s.slug,
      title: s.title,
      eyebrow: s.eyebrow ?? "",
      subtitle: s.subtitle ?? "",
      description: s.description ?? "",
      kind: (s.kind ?? "diagram") as StepKind,
      appliesTo: (s.applies_to ?? []) as StepCategory[],
      tier: (s.tier ?? null) as TierLevel | null,
      requiresSlug: s.requires_slug,
      requiresValue: s.requires_value,
      options: byStep[s.slug] ?? [],
    }));
    return { steps, disabledStepSlugs, disabledOptionsByStep };
  } catch {
    return null;
  }
}

/** Steps shown for a category + tier + current selections (with inheritance + conditionals). */
export function visibleLiveSteps(
  all: LiveStep[], cat: StepCategory, tierSlug: string, selections: Selections,
  /** Data-driven tiers flag from the mtm_garments row (has_tiers). When
   *  provided it wins over the static categoryHasTiers fallback, so the
   *  atelier's per-garment toggle decides — no hardcoded garment list. */
  tieredOverride?: boolean,
): LiveStep[] {
  const tiered = tieredOverride ?? categoryHasTiers(cat);
  const maxRank = tierRank(tierSlug);
  // Custom garments (overcoat, tuxedo, chinos…) that the atelier hasn't
  // assigned any step to yet inherit the full step set, so they open as
  // a complete customizer out of the box. Once the client ticks even one
  // step for the garment in /admin, that explicit selection takes over.
  const nonCore = !isCoreCategory(cat);
  const hasExplicit = nonCore && all.some((s) => s.appliesTo.includes(cat));
  return all.filter((s) => {
    const applies = s.appliesTo.includes(cat) || (nonCore && !hasExplicit);
    if (!applies) return false;
    if (tiered && s.tier && tierRank(s.tier) > maxRank) return false;
    if (s.requiresSlug && selections[s.requiresSlug] !== s.requiresValue) return false;
    return true;
  });
}

export function findLiveOption(all: LiveStep[], slug: string, value: string): LiveOption | undefined {
  return all.find((s) => s.slug === slug)?.options.find((o) => o.value === value);
}

/** Sum of surcharges for the currently selected options across the visible steps. */
export function surchargeTotal(visible: LiveStep[], selections: Selections): number {
  return visible.reduce((sum, s) => {
    const opt = s.options.find((o) => o.value === selections[s.slug]);
    return sum + (opt?.surcharge ?? 0);
  }, 0);
}

/** Parse a price label like "BHD 1,400" or "From $2,400" into a number. */
export function parsePrice(s: string | undefined | null): number {
  if (!s) return 0;
  const m = s.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
  return m ? Number(m[1]) : 0;
}

/** Format a BHD amount the same way the rest of the site does. */
export function formatBhd(n: number): string {
  return `BHD ${n.toLocaleString("en-US")}`;
}
