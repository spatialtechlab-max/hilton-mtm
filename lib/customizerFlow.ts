/**
 * Pure state-machine of the customizer's phase progression.
 *
 * Pulled out of the React component so it can be unit-tested without
 * mounting the page. The component re-imports `nextPhase` / `backPhase`
 * to keep its behaviour identical to what the tests pin down.
 *
 * The phases:
 *  fabric → tier → spec[0..n-1] → measurements → summary → cart
 *
 * The user's QA flagged a regression where shirts and trousers were
 * skipping the tier step entirely (because `categoryHasTiers` returned
 * false for them). Both branches now go through tier — these helpers
 * pin that behaviour down so it can't silently regress.
 */

import type { StepCategory } from "./customizer";

export type Phase = "fabric" | "tier" | "spec" | "measurements" | "summary" | "auth" | "cart";

export type FlowInput = {
  category: StepCategory;
  hasTiers: boolean;
  selectedFabric: boolean;
  stepIdx: number;
  stepCount: number;
};

/** Compute the next phase + step index given the current state.
 *  Returns `null` if "next" leaves the design flow (caller should route). */
export function nextPhase(
  phase: Phase,
  state: FlowInput,
): { phase: Phase; stepIdx: number } | null {
  if (phase === "fabric") {
    if (!state.selectedFabric) return null;
    // Tiers are universal now — every category sees the tier picker.
    return { phase: state.hasTiers ? "tier" : "spec", stepIdx: 0 };
  }
  if (phase === "tier") {
    return { phase: "spec", stepIdx: 0 };
  }
  if (phase === "spec") {
    if (state.stepIdx < state.stepCount - 1) {
      return { phase: "spec", stepIdx: state.stepIdx + 1 };
    }
    return { phase: "measurements", stepIdx: state.stepIdx };
  }
  if (phase === "measurements") {
    return { phase: "summary", stepIdx: state.stepIdx };
  }
  if (phase === "summary") {
    // Caller pushes the commission into the cart + routes to /cart.
    return null;
  }
  return null;
}

/** Compute the previous phase + step index. */
export function backPhase(
  phase: Phase,
  state: FlowInput,
): { phase: Phase; stepIdx: number } | null {
  if (phase === "spec") {
    if (state.stepIdx > 0) return { phase: "spec", stepIdx: state.stepIdx - 1 };
    if (state.hasTiers) return { phase: "tier", stepIdx: 0 };
    if (state.selectedFabric) return { phase: "fabric", stepIdx: 0 };
    return null;
  }
  if (phase === "measurements") {
    return { phase: "spec", stepIdx: Math.max(0, state.stepCount - 1) };
  }
  if (phase === "summary") {
    return { phase: "measurements", stepIdx: state.stepIdx };
  }
  if (phase === "tier") {
    return state.selectedFabric ? { phase: "fabric", stepIdx: 0 } : null;
  }
  return null;
}
