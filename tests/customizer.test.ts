import { describe, expect, test } from "vitest";
import {
  isCustomizeCategory,
  stepsForCategory,
  visibleSteps,
  measurementGroupsForCategory,
  categoryHasTiers,
  defaultSelections,
  tierPriceFor,
} from "@/lib/customizer";
import { parsePrice } from "@/lib/liveConfig";

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

describe("categoryHasTiers — every garment now passes through tier picker", () => {
  test.each(["suit", "jacket", "shirt", "trouser"] as const)(
    "%s honours the tier flow",
    (cat) => {
      expect(categoryHasTiers(cat)).toBe(true);
    },
  );
});

describe("tierPriceFor — category-specific tier pricing", () => {
  test("suit signature is د.ب 1,400 (unchanged baseline)", () => {
    expect(parsePrice(tierPriceFor("suit", "signature"))).toBe(1400);
  });
  test("shirt is priced as a single garment, not a commission", () => {
    expect(parsePrice(tierPriceFor("shirt", "essential"))).toBeLessThan(200);
    expect(parsePrice(tierPriceFor("shirt", "bespoke"))).toBeLessThan(500);
  });
  test("trouser sits between shirt and jacket", () => {
    expect(parsePrice(tierPriceFor("trouser", "signature"))).toBeGreaterThan(
      parsePrice(tierPriceFor("shirt", "signature")),
    );
    expect(parsePrice(tierPriceFor("trouser", "signature"))).toBeLessThan(
      parsePrice(tierPriceFor("jacket", "signature")),
    );
  });
  test("ordering: essential < signature < bespoke for every category", () => {
    for (const cat of ["suit", "jacket", "shirt", "trouser"] as const) {
      const e = parsePrice(tierPriceFor(cat, "essential"));
      const s = parsePrice(tierPriceFor(cat, "signature"));
      const b = parsePrice(tierPriceFor(cat, "bespoke"));
      expect(s).toBeGreaterThan(e);
      expect(b).toBeGreaterThan(s);
    }
  });
  test("unknown tier slug falls back to signature, not 0", () => {
    expect(parsePrice(tierPriceFor("suit", "platinum"))).toBe(1400);
  });
});
