/**
 * lib/erp turns the raw ERP feed into what customers actually see: which
 * products reach a shelf, what they are called, and what they cost. It sat at
 * 16% coverage while carrying the price the storefront displays and the
 * photo-strictness rule that silently hides products.
 *
 * sectionsFromErp is pure given an item array, so the whole mapping chain
 * (filtering, brand grouping, name cleanup, price resolution) is testable
 * without touching the network.
 */
import { describe, it, expect } from "vitest";
import { sectionsFromErp, isErpBacked, ERP_CATEGORIES_FOR_SLUG } from "@/lib/erp";

const ERP = "https://erp.hiltontailoringhouse.com/uploads/item_rawmaterial";

/** An item with a real on-form photo (`_pic1_`), so photo-led shelves accept it. */
const photographed = (over: Record<string, unknown> = {}) => ({
  id: 1, name: "SUITINGVBC 3073/004", categoryName: "SUITING", brandName: "VBC",
  onlinePrice: 175, sellingPrice: 40, status: "A",
  images: [`${ERP}/3103_pic1_cropped.jpg`, `${ERP}/3103_pic2_cropped.jpg`],
  thumbnail: `${ERP}/3103_pic_cropped.jpg`,
  ...over,
});

describe("sectionsFromErp", () => {
  it("returns nothing for a slug with no ERP categories", () => {
    expect(sectionsFromErp("not-a-library", [photographed() as never])).toEqual([]);
  });

  it("keeps only items in the slug's categories", () => {
    const items = [
      photographed({ id: 1, categoryName: "SUITING" }),
      photographed({ id: 2, categoryName: "TIE", name: "TIE Silk" }),
    ] as never[];
    const secs = sectionsFromErp("cloths", items);
    const skus = secs.flatMap((s) => s.items.map((i) => i.sku));
    expect(skus).toContain("1");
    expect(skus).not.toContain("2");
  });

  it("hides an item with no on-form photo from a photo-led shelf", () => {
    // Built-in shelves are photo-strict: a cloth with only a swatch must not
    // appear, or the shelf reads as cloth rather than garments.
    const noHero = photographed({ id: 9, images: [`${ERP}/9_pic3_cropped.jpg`] });
    expect(sectionsFromErp("cloths", [noHero] as never[])).toEqual([]);
  });

  it("shows the same item on a dynamic shelf, which is not photo-strict", () => {
    // Passing categories explicitly marks it dynamic: gating on a photo there
    // would 404 a whole shelf of real, in-stock garments.
    const noHero = photographed({ id: 9, images: [`${ERP}/9_pic3_cropped.jpg`] });
    const secs = sectionsFromErp("overcoat", [noHero] as never[], ["SUITING"]);
    expect(secs.flatMap((s) => s.items).length).toBe(1);
  });

  it("accepts an image pushed by our own tool as a valid on-form photo", () => {
    // Images we push are renamed item_<id>_<ts>_<n>; index 0 is the front.
    const pushed = photographed({ id: 448, images: [`${ERP}/item_448_1785950755_0.png`] });
    const secs = sectionsFromErp("cloths", [pushed] as never[]);
    expect(secs.flatMap((s) => s.items).length).toBe(1);
  });

  it("prices from onlinePrice, which is what the storefront shows", () => {
    const secs = sectionsFromErp("cloths", [photographed({ onlinePrice: 175, sellingPrice: 40 })] as never[]);
    expect(secs[0].items[0].price).toContain("175");
  });

  it("falls back to sellingPrice when onlinePrice is absent", () => {
    const secs = sectionsFromErp("cloths", [photographed({ onlinePrice: 0, sellingPrice: 45 })] as never[]);
    expect(secs[0].items[0].price).toContain("45");
  });

  it("groups by brand and counts correctly", () => {
    const items = [
      photographed({ id: 1, brandName: "VBC" }),
      photographed({ id: 2, brandName: "VBC" }),
      photographed({ id: 3, brandName: "Dormeuil" }),
    ] as never[];
    const secs = sectionsFromErp("cloths", items);
    const vbc = secs.find((s) => s.title.toLowerCase().includes("vbc"))!;
    expect(vbc.items).toHaveLength(2);
    expect(vbc.note).toContain("2 pieces");
    const dorm = secs.find((s) => s.title.toLowerCase().includes("dormeuil"))!;
    expect(dorm.note).toContain("1 piece");
    expect(dorm.note).not.toContain("1 pieces");
  });

  it("decodes HTML entities in a brand name", () => {
    // The feed returns "B&amp;S LINEN" for some rows; customers must not see
    // the raw entity.
    const secs = sectionsFromErp("cloths", [photographed({ brandName: "B&amp;S LINEN" })] as never[]);
    expect(secs[0].title).not.toContain("&amp;");
    expect(secs[0].title.toLowerCase()).toContain("b&s");
  });

  it("strips the category prefix baked into the ERP product name", () => {
    // "SUITINGVBC 3073/004" should read as the mill code, not the category.
    const secs = sectionsFromErp("cloths", [photographed({ name: "SUITINGVBC 3073/004" })] as never[]);
    expect(secs[0].items[0].name.toUpperCase()).not.toMatch(/^SUITING/);
    expect(secs[0].items[0].name.toUpperCase()).toContain("VBC");
  });

  it("leads the gallery with the on-form shot, not the swatch", () => {
    // The feed order varies; a shelf tile showing cloth instead of a garment
    // is the bug this ordering exists to prevent.
    const jumbled = photographed({
      images: [`${ERP}/3103_pic3_cropped.jpg`, `${ERP}/3103_pic1_cropped.jpg`],
    });
    const secs = sectionsFromErp("cloths", [jumbled] as never[]);
    expect(secs[0].items[0].media.src).toContain("_pic1_");
  });

  it("returns no sections when nothing matches, rather than an empty shell", () => {
    expect(sectionsFromErp("cloths", [] as never[])).toEqual([]);
  });

  it("carries the ERP id through as the sku the cart and repricing use", () => {
    const secs = sectionsFromErp("cloths", [photographed({ id: 3103 })] as never[]);
    expect(secs[0].items[0].sku).toBe("3103");
  });
});

describe("isErpBacked", () => {
  it("recognises the ERP-backed library slugs", () => {
    for (const slug of Object.keys(ERP_CATEGORIES_FOR_SLUG)) {
      expect(typeof isErpBacked(slug)).toBe("boolean");
    }
    expect(isErpBacked("cloths")).toBe(true);
  });

  it("rejects an unknown slug", () => {
    expect(isErpBacked("definitely-not-a-library")).toBe(false);
  });
});
