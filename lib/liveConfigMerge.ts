/**
 * Pure merge between the in-code static customizer config and the
 * Supabase-backed live config the atelier admin edits.
 *
 * Behaviour the storefront depends on:
 *  1. Admin edits to existing steps/options win over the static defaults
 *     (labels, surcharges, images, notes, tier).
 *  2. Admin can disable a step or option entirely — those are dropped
 *     from the customer's view.
 *  3. Admin can ADD new options to a step via /admin's "+ Add option";
 *     those previously fell on the floor because the merge iterated the
 *     static list only. They now appear after the static ones.
 *  4. Admin can ADD new steps to the DB via Seed or future tooling;
 *     those previously also disappeared. They now appear, sorted by
 *     the DB sort_order.
 *
 * Pulled out of `app/customize/page.tsx` so the propagation is unit-
 * testable without mounting the React tree. The component now imports
 * `mergeLiveAndStatic` directly.
 */

import type { LiveStep, LiveOption } from "./liveConfig";

export type MergeInput = {
  /** The in-code config the page boots with. */
  staticSteps: LiveStep[];
  /** Active rows from `mtm_steps` (admin-edited). */
  liveSteps: LiveStep[];
  /** Step slugs the admin has set `active = false` on. */
  disabledStepSlugs: Set<string>;
  /** Per-step set of option values the admin has set `active = false` on. */
  disabledOptionsByStep: Record<string, Set<string>>;
};

export function mergeLiveAndStatic(input: MergeInput): LiveStep[] {
  const { staticSteps, liveSteps, disabledStepSlugs, disabledOptionsByStep } = input;
  const liveBySlug = new Map(liveSteps.map((s) => [s.slug, s]));
  const staticBySlug = new Map(staticSteps.map((s) => [s.slug, s]));

  // 1. Start from the static order so the wizard sequence stays stable.
  const merged: LiveStep[] = staticSteps
    .filter((s) => !disabledStepSlugs.has(s.slug))
    .map((s) => {
      const live = liveBySlug.get(s.slug);
      const disabledOpts = disabledOptionsByStep[s.slug] ?? new Set<string>();
      if (!live) {
        return { ...s, options: s.options.filter((o) => !disabledOpts.has(o.value)) };
      }
      const liveOptByValue = new Map(live.options.map((o) => [o.value, o]));
      // Existing options keep their static order; live versions override.
      const overlaid: LiveOption[] = s.options
        .filter((o) => !disabledOpts.has(o.value))
        .map((o) => liveOptByValue.get(o.value) ?? o);
      // Admin-added options (values not in static) get appended in DB order.
      const staticValues = new Set(s.options.map((o) => o.value));
      const adminAdded: LiveOption[] = live.options.filter(
        (o) => !staticValues.has(o.value) && !disabledOpts.has(o.value),
      );
      return { ...live, options: [...overlaid, ...adminAdded] };
    });

  // 2. Append DB-only steps (admin created a new step that doesn't exist
  //    in the static config). They sit at the end of the wizard for now.
  for (const live of liveSteps) {
    if (disabledStepSlugs.has(live.slug)) continue;
    if (staticBySlug.has(live.slug)) continue;
    const disabledOpts = disabledOptionsByStep[live.slug] ?? new Set<string>();
    merged.push({
      ...live,
      options: live.options.filter((o) => !disabledOpts.has(o.value)),
    });
  }

  return merged;
}
