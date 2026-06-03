import { describe, expect, test } from "vitest";
import { parsePrice, formatBhd, surchargeTotal, type LiveStep } from "@/lib/liveConfig";

/**
 * Pricing helpers — pure functions, so they get tight tests.
 *
 * `parsePrice` is critical because the cart total is computed from it; any
 * regression here silently corrupts the order total written to mtm_orders.
 */

describe("parsePrice", () => {
  test("plain BHD label", () => {
    expect(parsePrice("BHD 1,400")).toBe(1400);
  });
  test("handles the leading dot in BHD (the regex used to drop after the .)", () => {
    expect(parsePrice("BHD 1,000")).toBe(1000);
  });
  test("`From $2,400` style", () => {
    expect(parsePrice("From $2,400")).toBe(2400);
  });
  test("decimal", () => {
    expect(parsePrice("BHD 199.50")).toBe(199.5);
  });
  test.each([null, undefined, "", "Priced per spec", "BHD —"])(
    "non-numeric input returns 0",
    (v) => {
      expect(parsePrice(v as string)).toBe(0);
    },
  );
});

describe("formatBhd", () => {
  test("adds thousands separators", () => {
    expect(formatBhd(1400)).toBe("BHD 1,400");
    expect(formatBhd(1590)).toBe("BHD 1,590");
    expect(formatBhd(0)).toBe("BHD 0");
  });
});

describe("surchargeTotal", () => {
  const steps: LiveStep[] = [
    {
      slug: "fit",
      title: "Fit",
      eyebrow: "",
      subtitle: "",
      description: "",
      kind: "diagram",
      appliesTo: ["suit"],
      tier: "essential",
      requiresSlug: null,
      requiresValue: null,
      options: [
        { value: "slim", label: "Slim", note: null, color: null, image: null, surcharge: 0 },
        { value: "tailored", label: "Tailored", note: null, color: null, image: null, surcharge: 100 },
      ],
    },
    {
      slug: "lining",
      title: "Lining",
      eyebrow: "",
      subtitle: "",
      description: "",
      kind: "diagram",
      appliesTo: ["suit"],
      tier: "signature",
      requiresSlug: null,
      requiresValue: null,
      options: [
        { value: "plain", label: "Plain", note: null, color: null, image: null, surcharge: 0 },
        { value: "fancy", label: "Fancy", note: null, color: null, image: null, surcharge: 90 },
      ],
    },
  ];
  test("sums selected surcharges", () => {
    expect(surchargeTotal(steps, { fit: "tailored", lining: "fancy" })).toBe(190);
  });
  test("ignores unselected steps", () => {
    expect(surchargeTotal(steps, { fit: "slim" })).toBe(0);
  });
  test("missing option value contributes 0", () => {
    expect(surchargeTotal(steps, { fit: "doesnt-exist" } as never)).toBe(0);
  });
});
