import { describe, test, expect } from "vitest";
import { stepsForCategory } from "@/lib/customizer";

/**
 * Pins the wizard step sequence per garment to the Hilton Bespoke
 * Booklet V4 (the client's authoritative document). Only steps that
 * appear in the booklet are wired — no invented add-ons. If anyone
 * reorders the static config or re-introduces a non-booklet step,
 * these tests break and force the conversation.
 */

describe("Booklet-aligned step set", () => {
  // Each garment's set of steps must match the Hilton Bespoke Booklet
  // V4 — nothing more, nothing less. Order is a separate concern the
  // atelier tunes via /admin sort_order, so we assert as a Set.
  const setOf = (slugs: string[]) => new Set(slugs);

  test("SUIT has booklet items 1-15 + 17-19, plus waistcoat (9-10); no sport-jacket", () => {
    const got = setOf(stepsForCategory("suit").map((s) => s.slug));
    expect(got).toEqual(setOf([
      // Essentials — jacket (booklet 1-6)
      "fit", "buttons", "lapel", "vents", "pockets", "ticket",
      // Essentials — pants (booklet 7-8)
      "pleats", "back-pocket",
      // Waistcoat (booklet 9-10) — unconditional, suit only
      "waistcoat-style", "waistcoat-lining",
      // Signature — pants (booklet 11-13)
      "cuffs-trouser", "suspenders", "belt",
      // Signature — jacket (booklet 14-15)
      "sleeve-buttons", "stitching",
      // To-line-or-not (booklet 17)
      "lining",
      // Polishes (booklet 18-19)
      "double-breasted", "tuxedo",
    ]));
  });

  test("JACKET has suit minus pants/waistcoat, plus sport-jacket (booklet 16)", () => {
    const got = setOf(stepsForCategory("jacket").map((s) => s.slug));
    expect(got).toEqual(setOf([
      "fit", "buttons", "lapel", "vents", "pockets", "ticket",
      "sleeve-buttons", "stitching", "lining",
      "double-breasted", "tuxedo", "sport-jacket",
    ]));
  });

  test("TROUSER has only the trouser-specific booklet items (7-8, 11-13)", () => {
    const got = setOf(stepsForCategory("trouser").map((s) => s.slug));
    expect(got).toEqual(setOf([
      "pleats", "back-pocket",
      "cuffs-trouser", "suspenders", "belt",
    ]));
  });

  test("SHIRT has exactly booklet items 20-25", () => {
    const got = setOf(stepsForCategory("shirt").map((s) => s.slug));
    expect(got).toEqual(setOf([
      "placket", "shirt-pocket", "back-pleats",
      "collar", "cuffs-shirt", "tux-shirt",
    ]));
  });
});
