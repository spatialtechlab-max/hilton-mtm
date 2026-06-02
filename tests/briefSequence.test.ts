import { describe, test, expect } from "vitest";
import { stepsForCategory } from "@/lib/customizer";

/**
 * Pins the wizard step sequence per garment to the client brief (V1).
 * If anyone reorders the static config or adds a step without thinking
 * about flow, these tests break and force the conversation.
 */

describe("Brief-aligned step sequence", () => {
  test("SUIT: Essentials (jacket then pants then waistcoat) → Signature (jacket then pants) → polishes → Bespoke", () => {
    const slugs = stepsForCategory("suit").map((s) => s.slug);
    expect(slugs).toEqual([
      // Essentials — jacket
      "fit", "buttons", "lapel", "vents", "pockets", "ticket", "lining-color",
      // Essentials — pants
      "pleats", "back-pocket",
      // Essentials — optional waistcoat (last two are conditional on add-waistcoat=yes)
      "add-waistcoat", "waistcoat-style", "waistcoat-lining",
      // Signature — jacket first (per brief)
      "sleeve-buttons", "stitching", "lining", "lining-fancy",
      // Signature — pants second
      "cuffs-trouser", "suspenders", "belt",
      // Polishes (kept as upsells per client direction)
      "double-breasted", "tuxedo",
      // Bespoke
      "canvas",
    ]);
  });

  test("JACKET: same as suit minus pants steps + waistcoat + plus sport-jacket polish", () => {
    const slugs = stepsForCategory("jacket").map((s) => s.slug);
    expect(slugs).toEqual([
      "fit", "buttons", "lapel", "vents", "pockets", "ticket", "lining-color",
      "sleeve-buttons", "stitching", "lining", "lining-fancy",
      "double-breasted", "tuxedo", "sport-jacket",
      "canvas",
    ]);
  });

  test("TROUSER: standalone trouser flow (no tier picker, no jacket steps)", () => {
    const slugs = stepsForCategory("trouser").map((s) => s.slug);
    expect(slugs).toEqual([
      "fit",
      "pleats", "back-pocket",
      "cuffs-trouser", "suspenders", "belt",
    ]);
  });

  test("SHIRT: exactly the 5 brief essentials + cuff finish, no fit / no tux", () => {
    const slugs = stepsForCategory("shirt").map((s) => s.slug);
    expect(slugs).toEqual([
      "placket", "shirt-pocket", "back-pleats",
      "collar", "cuffs-shirt", "cuff-tier",
    ]);
  });
});
