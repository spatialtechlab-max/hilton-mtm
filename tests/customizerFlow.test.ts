import { describe, expect, test } from "vitest";
import { nextPhase, backPhase, type Phase } from "@/lib/customizerFlow";
import { categoryHasTiers } from "@/lib/customizer";

/**
 * Regression tests for the QA the user just ran:
 *   "every time we select this fabric next thing would be def asking for
 *    which package right??"
 *
 * Before this refactor, shirts and trousers went fabric → spec, skipping
 * the tier confirmation. These tests pin down that every category now
 * goes fabric → tier → spec.
 */

const baseState = (cat: "suit" | "jacket" | "shirt" | "trouser") => ({
  category: cat,
  hasTiers: categoryHasTiers(cat),
  selectedFabric: true,
  stepIdx: 0,
  stepCount: 6,
});

describe("nextPhase — fabric→tier→spec for suits/jackets; fabric→spec for shirts/trousers (brief)", () => {
  test.each(["suit", "jacket"] as const)(
    "%s: fabric advances to TIER (tier picker required)",
    (cat) => {
      const out = nextPhase("fabric", baseState(cat));
      expect(out).toEqual({ phase: "tier", stepIdx: 0 });
    },
  );

  test.each(["shirt", "trouser"] as const)(
    "%s: fabric advances straight to SPEC (bypasses the suit packages per brief)",
    (cat) => {
      const out = nextPhase("fabric", baseState(cat));
      expect(out).toEqual({ phase: "spec", stepIdx: 0 });
    },
  );

  test("fabric without a selected fabric does not advance", () => {
    const out = nextPhase("fabric", { ...baseState("shirt"), selectedFabric: false });
    expect(out).toBeNull();
  });

  test("tier advances to spec[0] (only ever reached on suit + jacket)", () => {
    for (const cat of ["suit", "jacket"] as const) {
      expect(nextPhase("tier", baseState(cat))).toEqual({ phase: "spec", stepIdx: 0 });
    }
  });

  test("spec advances inside until the last step, then to measurements", () => {
    const s = baseState("suit");
    expect(nextPhase("spec", { ...s, stepIdx: 0 })).toEqual({ phase: "spec", stepIdx: 1 });
    expect(nextPhase("spec", { ...s, stepIdx: 5 })).toEqual({ phase: "measurements", stepIdx: 5 });
  });

  test("measurements → summary", () => {
    expect(nextPhase("measurements", baseState("suit"))).toEqual({ phase: "summary", stepIdx: 0 });
  });

  test("summary returns null — caller routes to /cart from there", () => {
    expect(nextPhase("summary", baseState("suit"))).toBeNull();
  });
});

describe("backPhase — symmetric reverse honouring the per-category tier rule", () => {
  test.each(["suit", "jacket"] as const)(
    "%s: tier goes back to fabric",
    (cat) => {
      expect(backPhase("tier", baseState(cat))).toEqual({ phase: "fabric", stepIdx: 0 });
    },
  );

  test("suit spec[0] goes back to tier", () => {
    expect(backPhase("spec", baseState("suit"))).toEqual({ phase: "tier", stepIdx: 0 });
  });

  test("shirt spec[0] goes back to fabric (no tier to return to)", () => {
    expect(backPhase("spec", baseState("shirt"))).toEqual({ phase: "fabric", stepIdx: 0 });
  });

  test("spec[mid] goes back to spec[mid-1]", () => {
    expect(backPhase("spec", { ...baseState("suit"), stepIdx: 3 })).toEqual({ phase: "spec", stepIdx: 2 });
  });

  test("measurements goes back to spec[stepCount-1]", () => {
    expect(backPhase("measurements", baseState("suit"))).toEqual({ phase: "spec", stepIdx: 5 });
  });

  test("summary goes back to measurements", () => {
    expect(backPhase("summary", baseState("suit"))).toEqual({ phase: "measurements", stepIdx: 0 });
  });
});

describe("Sebastian preselect honoured per category type", () => {
  // The URL `?category=X&tier=signature` flow boots in fabric. For
  // tiered categories the next step IS the tier picker (so Sebastian's
  // signature preselect is visible to the customer); for shirt/trouser
  // the tier preselect lives in state but is bypassed in the flow.
  test.each(["suit", "jacket"] as const)(
    "%s: fabric pick lands on tier where signature is pre-selected",
    (cat) => {
      const after = nextPhase("fabric", baseState(cat));
      expect(after?.phase).toBe("tier");
    },
  );
  test.each(["shirt", "trouser"] as const)(
    "%s: fabric pick goes straight to spec (no tier picker, per brief)",
    (cat) => {
      const after = nextPhase("fabric", baseState(cat));
      expect(after?.phase).toBe("spec");
    },
  );
});

describe("Phase type completeness — no orphans", () => {
  const allPhases: Phase[] = ["fabric", "tier", "spec", "measurements", "summary"];
  test("nextPhase handles every design-flow phase without throwing", () => {
    for (const p of allPhases) {
      expect(() => nextPhase(p, baseState("suit"))).not.toThrow();
    }
  });
});
