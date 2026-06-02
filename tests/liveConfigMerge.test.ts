import { describe, expect, test } from "vitest";
import { mergeLiveAndStatic } from "@/lib/liveConfigMerge";
import type { LiveStep, LiveOption } from "@/lib/liveConfig";

/**
 * Pinning admin → customer propagation.
 *
 * This is the regression suite for "if I change a value in /admin or click
 * Seed from current config, will the customer actually see it?". Every
 * meaningful admin action gets one explicit test below.
 */

function opt(value: string, label = value, surcharge = 0): LiveOption {
  return { value, label, note: null, color: null, image: null, surcharge };
}

function step(slug: string, options: LiveOption[], title = slug): LiveStep {
  return {
    slug,
    title,
    eyebrow: "",
    subtitle: "",
    description: "",
    kind: "diagram",
    appliesTo: ["suit"],
    tier: "essential",
    requiresSlug: null,
    requiresValue: null,
    options,
  };
}

const emptyDisabled = { disabledStepSlugs: new Set<string>(), disabledOptionsByStep: {} };

describe("Static-only (admin hasn't touched the DB)", () => {
  test("static config is returned unchanged when liveSteps is empty", () => {
    const staticSteps = [step("fit", [opt("slim"), opt("tailored")])];
    const out = mergeLiveAndStatic({ staticSteps, liveSteps: [], ...emptyDisabled });
    expect(out).toHaveLength(1);
    expect(out[0].slug).toBe("fit");
    expect(out[0].options.map((o) => o.value)).toEqual(["slim", "tailored"]);
  });
});

describe("Admin edits to existing rows win over the static defaults", () => {
  test("edited option label propagates", () => {
    const staticSteps = [step("fit", [opt("slim", "Slim Fit")])];
    const liveSteps = [step("fit", [opt("slim", "Athletic")])];
    const out = mergeLiveAndStatic({ staticSteps, liveSteps, ...emptyDisabled });
    expect(out[0].options[0].label).toBe("Athletic");
  });

  test("edited option surcharge propagates", () => {
    const staticSteps = [step("fit", [opt("slim", "Slim", 0)])];
    const liveSteps = [step("fit", [opt("slim", "Slim", 75)])];
    const out = mergeLiveAndStatic({ staticSteps, liveSteps, ...emptyDisabled });
    expect(out[0].options[0].surcharge).toBe(75);
  });

  test("edited option image propagates", () => {
    const staticSteps = [step("fit", [opt("slim")])];
    const live: LiveOption = { ...opt("slim"), image: "/uploads/new.png" };
    const liveSteps = [step("fit", [live])];
    const out = mergeLiveAndStatic({ staticSteps, liveSteps, ...emptyDisabled });
    expect(out[0].options[0].image).toBe("/uploads/new.png");
  });

  test("edited step title propagates", () => {
    const staticSteps = [step("fit", [opt("slim")], "Find your fit")];
    const liveSteps = [step("fit", [opt("slim")], "Choose your cut")];
    const out = mergeLiveAndStatic({ staticSteps, liveSteps, ...emptyDisabled });
    expect(out[0].title).toBe("Choose your cut");
  });
});

describe("Admin can hide things", () => {
  test("disabled step is dropped from the customer's view", () => {
    const staticSteps = [step("fit", [opt("slim")]), step("buttons", [opt("two")])];
    const out = mergeLiveAndStatic({
      staticSteps,
      liveSteps: [],
      disabledStepSlugs: new Set(["buttons"]),
      disabledOptionsByStep: {},
    });
    expect(out.map((s) => s.slug)).toEqual(["fit"]);
  });

  test("disabled option is dropped from the customer's view", () => {
    const staticSteps = [step("fit", [opt("slim"), opt("standard")])];
    const out = mergeLiveAndStatic({
      staticSteps,
      liveSteps: [],
      disabledStepSlugs: new Set(),
      disabledOptionsByStep: { fit: new Set(["standard"]) },
    });
    expect(out[0].options.map((o) => o.value)).toEqual(["slim"]);
  });
});

describe("Admin ADDITIONS (the bug the audit caught)", () => {
  test("admin-added option appears after the static ones", () => {
    const staticSteps = [step("fit", [opt("slim"), opt("tailored")])];
    // Admin uses the + Add option button in /admin to introduce "athletic".
    const liveSteps = [
      step("fit", [opt("slim"), opt("tailored"), opt("athletic", "Athletic")]),
    ];
    const out = mergeLiveAndStatic({ staticSteps, liveSteps, ...emptyDisabled });
    expect(out[0].options.map((o) => o.value)).toEqual(["slim", "tailored", "athletic"]);
  });

  test("admin-added option preserves its label + surcharge", () => {
    const staticSteps = [step("fit", [opt("slim")])];
    const liveSteps = [step("fit", [opt("slim"), opt("athletic", "Athletic", 120)])];
    const out = mergeLiveAndStatic({ staticSteps, liveSteps, ...emptyDisabled });
    const added = out[0].options.find((o) => o.value === "athletic");
    expect(added).toBeDefined();
    expect(added?.label).toBe("Athletic");
    expect(added?.surcharge).toBe(120);
  });

  test("a brand-new step in the DB shows up at the end of the wizard", () => {
    const staticSteps = [step("fit", [opt("slim")])];
    const liveSteps = [step("monogram", [opt("none"), opt("initials")])];
    const out = mergeLiveAndStatic({ staticSteps, liveSteps, ...emptyDisabled });
    expect(out.map((s) => s.slug)).toEqual(["fit", "monogram"]);
    expect(out[1].options.map((o) => o.value)).toEqual(["none", "initials"]);
  });

  test("disabling an admin-added option also drops it", () => {
    const staticSteps = [step("fit", [opt("slim")])];
    const liveSteps = [step("fit", [opt("slim"), opt("athletic")])];
    const out = mergeLiveAndStatic({
      staticSteps,
      liveSteps,
      disabledStepSlugs: new Set(),
      disabledOptionsByStep: { fit: new Set(["athletic"]) },
    });
    expect(out[0].options.map((o) => o.value)).toEqual(["slim"]);
  });
});

describe("Seed safety — re-seeding does not clobber admin edits", () => {
  // seedFromConfig uses { onConflict, ignoreDuplicates: true } so existing
  // DB rows are kept. From the merge's point of view, this means: even
  // after a Seed, the live DB still holds the admin's edits, and the
  // merge surfaces them. We simulate that here.
  test("admin edits remain after a Seed adds only-new rows", () => {
    const staticSteps = [step("fit", [opt("slim", "Slim Fit"), opt("athletic", "Athletic")])];
    // After Seed: the admin's earlier edit (label="Trim") is still there;
    // Seed only added the option for "athletic" because it was missing.
    const liveSteps = [step("fit", [opt("slim", "Trim"), opt("athletic", "Athletic")])];
    const out = mergeLiveAndStatic({ staticSteps, liveSteps, ...emptyDisabled });
    expect(out[0].options[0].label).toBe("Trim"); // not clobbered
    expect(out[0].options[1].value).toBe("athletic");
  });
});
