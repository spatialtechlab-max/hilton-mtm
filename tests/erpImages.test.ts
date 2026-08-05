/**
 * The storefront decides whether an ERP item is shelf-ready by reading the
 * image FILENAME. There are two naming conventions in the feed and only one
 * was understood, which silently hid every product the image tool filled in:
 *
 *   atelier upload   .../2832_pic1_cropped.jpg        (IMAGE 1 = on-form hero)
 *   pushed by us     .../item_448_1785950755_0.png    (0 = front, 1 = back, 2 = swatch)
 */
import { describe, it, expect } from "vitest";
import { apiPushIndex, slotRank } from "@/lib/erp";

const ERP = "https://erp.hiltontailoringhouse.com/uploads/item_rawmaterial";

describe("apiPushIndex", () => {
  it("reads the slot out of a filename the ERP generated for our push", () => {
    expect(apiPushIndex(`${ERP}/item_448_1785950755_0.png`)).toBe(0);
    expect(apiPushIndex(`${ERP}/item_448_1785950755_1.jpg`)).toBe(1);
    expect(apiPushIndex(`${ERP}/item_2835_1785951231_2.webp`)).toBe(2);
  });

  it("returns null for the atelier's own uploads and for junk", () => {
    expect(apiPushIndex(`${ERP}/2832_pic1_cropped.jpg`)).toBeNull();
    expect(apiPushIndex(`${ERP}/2832_pic_cropped.jpg`)).toBeNull();
    expect(apiPushIndex("/products/no-image.svg")).toBeNull();
    expect(apiPushIndex("")).toBeNull();
  });
});

describe("slotRank", () => {
  it("puts the on-form hero first under either convention", () => {
    expect(slotRank(`${ERP}/2832_pic1_cropped.jpg`)).toBe(0);
    expect(slotRank(`${ERP}/item_448_1785950755_0.png`)).toBe(0);
  });

  it("ranks back shots after the hero and swatches last", () => {
    expect(slotRank(`${ERP}/2832_pic2_cropped.jpg`)).toBe(1);
    expect(slotRank(`${ERP}/item_448_1785950755_1.png`)).toBe(1);
    expect(slotRank(`${ERP}/2832_pic_cropped.jpg`)).toBe(2);
    expect(slotRank(`${ERP}/item_448_1785950755_2.png`)).toBe(2);
  });

  it("sorts a mixed, out-of-order gallery into front, back, swatch", () => {
    const gallery = [
      `${ERP}/item_448_1785950755_2.png`,
      `${ERP}/2832_pic2_cropped.jpg`,
      `${ERP}/item_448_1785950755_0.png`,
    ];
    expect([...gallery].sort((a, b) => slotRank(a) - slotRank(b))).toEqual([
      `${ERP}/item_448_1785950755_0.png`,
      `${ERP}/2832_pic2_cropped.jpg`,
      `${ERP}/item_448_1785950755_2.png`,
    ]);
  });

  it("treats an unrecognised name as a swatch rather than promoting it to hero", () => {
    expect(slotRank(`${ERP}/something-else.png`)).toBe(2);
  });
});
