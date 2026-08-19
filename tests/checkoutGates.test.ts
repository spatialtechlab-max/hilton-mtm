/**
 * The three pure rules that decide whether an order can be placed and what it
 * costs: which measurements are required, whether delivery is free, and whether
 * a discount code is even shaped like one. All three were untested, and all
 * three are enforced on the server at payment time.
 */
import { describe, it, expect } from "vitest";
import { requiredMeasurementGroups, requiredMeasurementSlugs, missingMeasurements } from "@/lib/measurementRules";
import { isFreeShippingCountry } from "@/lib/shippingZones";
import { CODE_REGEX, isValidCodeFormat } from "@/lib/discountCodes";

describe("measurement requirements", () => {
  it("asks for nothing when the bag holds only accessories", () => {
    // An accessory-only order must never be blocked on body measurements.
    expect(requiredMeasurementGroups([])).toHaveLength(0);
    expect(missingMeasurements({}, [])).toHaveLength(0);
  });

  it("asks only for lower body for trousers", () => {
    const g = requiredMeasurementGroups(["trouser"]).map((x) => x.slug);
    expect(g).toEqual(["lower"]);
  });

  it("treats chinos and pants as lower body too", () => {
    expect(requiredMeasurementGroups(["chino-pants"]).map((x) => x.slug)).toEqual(["lower"]);
    expect(requiredMeasurementGroups(["PANTS"]).map((x) => x.slug)).toEqual(["lower"]);
  });

  it("asks for both halves for a suit", () => {
    const g = requiredMeasurementGroups(["suit"]).map((x) => x.slug);
    expect(g).toContain("upper");
    expect(g).toContain("lower");
  });

  it("asks only for upper body for a jacket or shirt", () => {
    expect(requiredMeasurementGroups(["jacket"]).map((x) => x.slug)).toEqual(["upper"]);
    expect(requiredMeasurementGroups(["shirt"]).map((x) => x.slug)).toEqual(["upper"]);
  });

  it("treats an unknown commissioned garment as upper body rather than skipping it", () => {
    // Failing open here would let a garment be cut with no measurements at all.
    expect(requiredMeasurementGroups(["overcoat"]).map((x) => x.slug)).toEqual(["upper"]);
  });

  it("unions the requirements across a mixed bag", () => {
    const g = requiredMeasurementGroups(["shirt", "trouser"]).map((x) => x.slug);
    expect(g).toContain("upper");
    expect(g).toContain("lower");
  });

  it("reports every blank measurement, not just the first", () => {
    const missing = missingMeasurements({}, ["suit"]);
    expect(missing.length).toBe(requiredMeasurementSlugs(["suit"]).length);
  });

  it("treats whitespace as blank, so ' ' cannot pass the gate", () => {
    const slugs = requiredMeasurementSlugs(["shirt"]);
    const allSpaces = Object.fromEntries(slugs.map((s) => [s, "   "]));
    expect(missingMeasurements(allSpaces, ["shirt"])).toHaveLength(slugs.length);
  });

  it("passes when every required value is filled", () => {
    const slugs = requiredMeasurementSlugs(["shirt"]);
    const filled = Object.fromEntries(slugs.map((s) => [s, "40"]));
    expect(missingMeasurements(filled, ["shirt"])).toHaveLength(0);
  });

  it("treats null values as nothing on file", () => {
    expect(missingMeasurements(null, ["suit"]).length).toBeGreaterThan(0);
    expect(missingMeasurements(undefined, ["suit"]).length).toBeGreaterThan(0);
  });
});

describe("free shipping by country", () => {
  const list = [{ country: "bahrain" }, { country: "United Arab Emirates" }, { country: "USA" }];

  it("matches regardless of case, since the table stores it lowercased", () => {
    expect(isFreeShippingCountry("Bahrain", list)).toBe(true);
    expect(isFreeShippingCountry("BAHRAIN", list)).toBe(true);
    expect(isFreeShippingCountry("bahrain", list)).toBe(true);
  });

  it("ignores surrounding whitespace from a typed address", () => {
    expect(isFreeShippingCountry("  Bahrain  ", list)).toBe(true);
  });

  it("charges delivery for a country that is not listed", () => {
    expect(isFreeShippingCountry("Germany", list)).toBe(false);
    expect(isFreeShippingCountry("United Kingdom", list)).toBe(false);
  });

  it("charges delivery when the address has no country", () => {
    // Failing open here would give away shipping on every incomplete address.
    expect(isFreeShippingCountry("", list)).toBe(false);
    expect(isFreeShippingCountry(null, list)).toBe(false);
    expect(isFreeShippingCountry(undefined, list)).toBe(false);
  });

  it("charges delivery when the list is empty", () => {
    expect(isFreeShippingCountry("Bahrain", [])).toBe(false);
  });

  it("accepts a plain string list as well as rows", () => {
    expect(isFreeShippingCountry("Bahrain", ["bahrain"])).toBe(true);
  });

  it("does not match on a partial name", () => {
    expect(isFreeShippingCountry("Bahr", list)).toBe(false);
    expect(isFreeShippingCountry("USA Minor Outlying Islands", list)).toBe(false);
  });
});

describe("discount code format", () => {
  it("accepts the house format: 3 alphanumeric then 2 digits", () => {
    expect(isValidCodeFormat("DIS25")).toBe(true);
    expect(isValidCodeFormat("NEW26")).toBe(true);
    expect(isValidCodeFormat("A1B99")).toBe(true);
    expect(isValidCodeFormat("12345")).toBe(true);
  });

  it("rejects the wrong length", () => {
    expect(isValidCodeFormat("DIS2")).toBe(false);
    expect(isValidCodeFormat("DIS255")).toBe(false);
    expect(isValidCodeFormat("")).toBe(false);
  });

  it("requires the last two characters to be digits", () => {
    expect(isValidCodeFormat("DISAB")).toBe(false);
    expect(isValidCodeFormat("DIS2A")).toBe(false);
  });

  it("rejects lowercase, so codes are compared in one canonical case", () => {
    expect(isValidCodeFormat("dis25")).toBe(false);
  });

  it("rejects punctuation and spaces", () => {
    expect(isValidCodeFormat("DI-25")).toBe(false);
    expect(isValidCodeFormat("DI 25")).toBe(false);
    expect(isValidCodeFormat("DIS2!")).toBe(false);
  });

  it("is anchored, so a valid code inside junk is not accepted", () => {
    // An unanchored pattern would let "xxDIS25xx" through.
    expect(CODE_REGEX.test("xxDIS25xx")).toBe(false);
    expect(CODE_REGEX.test("DIS25\nDIS25")).toBe(false);
  });
});
