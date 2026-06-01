import { describe, expect, test } from "vitest";
import {
  isCustomizeCategory,
  stepsForCategory,
  visibleSteps,
  measurementGroupsForCategory,
  categoryHasTiers,
  defaultSelections,
} from "@/lib/customizer";

/**
 * Customizer segregation. The user has called this out as load-bearing —
 * a regression here puts trouser steps in front of a shirt buyer.
 */

describe("isCustomizeCategory", () => {
  test.each(["suit", "jacket", "shirt", "trouser"])("accepts %s", (v) => {
    expect(isCustomizeCategory(v)).toBe(true);
  });
  test.each(["garment", "trousers", "Shirt", "", null, undefined])(
    "rejects %s",
    (v) => {
      expect(isCustomizeCategory(v as string | null | undefined)).toBe(false);
    },
  );
});

describe("stepsForCategory", () => {
  test("shirt has no lapel/vents/waistcoat/tuxedo", () => {
    const slugs = stepsForCategory("shirt").map((s) => s.slug);
    expect(slugs).not.toContain("lapel");
    expect(slugs).not.toContain("vents");
    expect(slugs).not.toContain("add-waistcoat");
    expect(slugs).not.toContain("tuxedo");
  });
  test("shirt includes collar + cuffs-shirt + placket", () => {
    const slugs = stepsForCategory("shirt").map((s) => s.slug);
    expect(slugs).toEqual(expect.arrayContaining(["collar", "cuffs-shirt", "placket"]));
  });
  test("trouser excludes lapel + buttons + tuxedo", () => {
    const slugs = stepsForCategory("trouser").map((s) => s.slug);
    expect(slugs).not.toContain("lapel");
    expect(slugs).not.toContain("buttons");
    expect(slugs).not.toContain("tuxedo");
  });
  test("trouser includes pleats + back-pocket + cuffs-trouser", () => {
    const slugs = stepsForCategory("trouser").map((s) => s.slug);
    expect(slugs).toEqual(expect.arrayContaining(["pleats", "back-pocket", "cuffs-trouser"]));
  });
  test("suit inherits everything jacket + trouser have, plus waistcoat", () => {
    const slugs = stepsForCategory("suit").map((s) => s.slug);
    expect(slugs).toEqual(expect.arrayContaining(["lapel", "pleats", "add-waistcoat"]));
  });
});

describe("visibleSteps respects tier ranking", () => {
  test("essential tier sees no signature-only steps", () => {
    const visible = visibleSteps("suit", "essential", defaultSelections()).map((s) => s.slug);
    expect(visible).not.toContain("suspenders");
    expect(visible).not.toContain("stitching");
    expect(visible).not.toContain("canvas");
  });
  test("bespoke tier sees the bespoke-only canvas step", () => {
    const visible = visibleSteps("suit", "bespoke", defaultSelections()).map((s) => s.slug);
    expect(visible).toContain("canvas");
  });
  test("waistcoat-style is gated by add-waistcoat=yes", () => {
    const off = visibleSteps("suit", "signature", { ...defaultSelections(), "add-waistcoat": "no" });
    expect(off.find((s) => s.slug === "waistcoat-style")).toBeUndefined();
    const on = visibleSteps("suit", "signature", { ...defaultSelections(), "add-waistcoat": "yes" });
    expect(on.find((s) => s.slug === "waistcoat-style")).toBeTruthy();
  });
});

describe("measurementGroupsForCategory", () => {
  test("shirt does not ask for trouser measurements", () => {
    const items = measurementGroupsForCategory("shirt").flatMap((g) => g.items).map((m) => m.slug);
    expect(items).not.toContain("waist");
    expect(items).not.toContain("crotch");
    expect(items).not.toContain("pants-length");
  });
  test("trouser does not ask for shoulder/chest/bicep", () => {
    const items = measurementGroupsForCategory("trouser").flatMap((g) => g.items).map((m) => m.slug);
    expect(items).not.toContain("shoulder");
    expect(items).not.toContain("chest");
    expect(items).not.toContain("bicep");
  });
});

describe("categoryHasTiers", () => {
  test("suit + jacket use tiers", () => {
    expect(categoryHasTiers("suit")).toBe(true);
    expect(categoryHasTiers("jacket")).toBe(true);
  });
  test("shirt + trouser do not", () => {
    expect(categoryHasTiers("shirt")).toBe(false);
    expect(categoryHasTiers("trouser")).toBe(false);
  });
});
