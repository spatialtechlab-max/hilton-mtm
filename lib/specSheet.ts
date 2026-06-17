/**
 * Generates a one-page, brand-styled PDF spec sheet from the customizer
 * selections. Runs entirely client-side via pdf-lib.
 *
 * The sheet matches the cream + burgundy aesthetic of the rest of the
 * site so the visitor can save / print / take it to the atelier.
 */

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import {
  tiers, findOption, type Selections,
  type MeasurementValues, type MeasurementUnit,
  type StepCategory, visibleSteps, measurementGroupsForCategory, categoryHasTiers,
} from "./customizer";

// Pantone 7421 C burgundy + ivory page tone, expressed as pdf-lib rgb (0..1).
const BURGUNDY = rgb(0x6e / 255, 0x26 / 255, 0x39 / 255);
const CHARCOAL = rgb(0x14 / 255, 0x11 / 255, 0x0f / 255);
const MUTED    = rgb(0x6b / 255, 0x62 / 255, 0x5a / 255);
const IVORY_BG = rgb(0xf6 / 255, 0xf1 / 255, 0xea / 255);
const RULE     = rgb(0x14 / 255, 0x11 / 255, 0x0f / 255);

const A4 = { w: 595.28, h: 841.89 };

/**
 * pdf-lib's standard fonts (WinAnsi-encoded) can't render Arabic glyphs.
 * Convert the BHD dinar symbol to the Latin "BHD" abbreviation for PDF
 * output only — the site keeps the Arabic symbol everywhere else.
 */
const toLatin = (s: string) => s.replace(/د\.?ب\.?/g, "BHD").trim();

export type SpecPdfExtras = {
  measurements?: MeasurementValues;
  unit?: MeasurementUnit;
  category?: StepCategory;
};

export async function buildSpecPdf(
  selections: Selections,
  tierSlug: string,
  customerName?: string,
  extras?: SpecPdfExtras,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();

  const serif     = await pdf.embedFont(StandardFonts.TimesRoman);
  const serifBold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const sans      = await pdf.embedFont(StandardFonts.Helvetica);

  // Preload the logo bytes once — used on every page header.
  let logoImage: Awaited<ReturnType<typeof pdf.embedPng>> | null = null;
  try {
    const logoBytes = await fetch("/logo-burgundy.png").then((r) => r.arrayBuffer());
    logoImage = await pdf.embedPng(logoBytes);
  } catch { /* fall back to text headers */ }

  const colLeftX  = 70;
  const colMidX   = A4.w / 2;

  // Content must stay ABOVE this y; the footer sits below it. A heavily
  // customised garment has many specification lines, so the list is
  // paginated rather than left to run straight through the footer (the
  // overlap bug). drawChrome paints the page background + logo on every
  // page; drawFooter stamps the address block on every page.
  const BOTTOM_SAFE = 120;

  const drawChrome = (p: ReturnType<PDFDocument["addPage"]>) => {
    p.drawRectangle({ x: 0, y: 0, width: A4.w, height: A4.h, color: IVORY_BG });
    if (logoImage) {
      const targetH = 56;
      const ratio = targetH / logoImage.height;
      p.drawImage(logoImage, {
        x: A4.w / 2 - (logoImage.width * ratio) / 2,
        y: A4.h - 100,
        width: logoImage.width * ratio,
        height: targetH,
      });
    } else {
      p.drawText("HILTON MADE TO MEASURE", {
        x: A4.w / 2 - 110, y: A4.h - 70, size: 14, font: serifBold, color: BURGUNDY,
      });
    }
  };

  const drawFooter = (p: ReturnType<PDFDocument["addPage"]>) => {
    drawRule(p, colLeftX, 90, A4.w - colLeftX * 2);
    centerText(p, "HILTON MADE TO MEASURE", 72, { font: sans, size: 8, color: BURGUNDY, tracking: 3 });
    centerText(p, "Shop No. 119, Shaikh Abdulla Avenue  ·  Manama, Kingdom of Bahrain", 58, { font: sans, size: 8, color: MUTED, tracking: 1.5 });
    centerText(p, "atelier@hiltonmtm.com  ·  +973 17 245 689", 46, { font: sans, size: 8, color: MUTED, tracking: 1.5 });
  };

  let page = pdf.addPage([A4.w, A4.h]);
  drawChrome(page);

  // ── Title block (first page only) ──────────────────────────────────────
  const eyebrowY = A4.h - 160;
  centerText(page, "BESPOKE SPECIFICATION", eyebrowY, {
    font: sans, size: 8, color: MUTED, tracking: 3,
  });
  centerText(page, "Made to Measure — Specification Sheet", eyebrowY - 32, {
    font: serif, size: 22, color: CHARCOAL,
  });
  const stamp = new Date().toLocaleDateString("en-GB", {
    day: "2-digit", month: "long", year: "numeric",
  });
  centerText(page, `Issued ${stamp}${customerName ? `  ·  For ${customerName}` : ""}`, eyebrowY - 54, {
    font: sans, size: 9, color: MUTED, tracking: 1.5,
  });
  drawRule(page, A4.w / 2 - 40, eyebrowY - 76, 80);

  // ── Specifications list ────────────────────────────────────────────────
  let cursorY     = A4.h - 220;
  const rowH      = 22;

  const category = extras?.category ?? "suit";
  const specSteps = visibleSteps(category, tierSlug, selections);
  const showCommission = categoryHasTiers(category);

  // Break to a fresh continuation page when the next block won't fit above
  // the footer. Continuation pages keep the logo but drop the title block.
  const ensure = (needed: number) => {
    if (cursorY - needed < BOTTOM_SAFE) {
      drawFooter(page);
      page = pdf.addPage([A4.w, A4.h]);
      drawChrome(page);
      cursorY = A4.h - 140;
    }
  };

  // Section header
  drawSectionHeader(page, "GARMENT SPECIFICATION", colLeftX, cursorY, serifBold);
  cursorY -= 20;
  drawRule(page, colLeftX, cursorY, A4.w - colLeftX * 2);
  cursorY -= 18;

  for (const step of specSteps) {
    const value = selections[step.slug];
    const option = findOption(step.slug, value);
    if (!option) continue;

    ensure(rowH);

    // Step title (left)
    page.drawText(step.title, {
      x: colLeftX, y: cursorY, size: 9.5, font: sans, color: MUTED,
    });
    // Selected option (right, bold serif)
    const choice = option.label;
    const choiceWidth = serifBold.widthOfTextAtSize(choice, 11);
    page.drawText(choice, {
      x: A4.w - colLeftX - choiceWidth, y: cursorY, size: 11, font: serifBold, color: CHARCOAL,
    });

    cursorY -= rowH;
  }

  cursorY -= 12;
  ensure(0);
  drawRule(page, colLeftX, cursorY, A4.w - colLeftX * 2);

  // ── Commission / tier block ─────────────────────────────────────────────
  const tier = tiers.find((t) => t.slug === tierSlug) ?? tiers[1];

  if (showCommission) {
    // Keep the whole commission block on one page rather than splitting it.
    ensure(30 + 28 + 16 + 22 + 18 + tier.features.length * 14 + 10);
    cursorY -= 30;
    drawSectionHeader(page, "COMMISSION", colLeftX, cursorY, serifBold);
    cursorY -= 28;

    page.drawText(tier.name.toUpperCase(), {
      x: colLeftX, y: cursorY, size: 18, font: serif, color: BURGUNDY,
    });
    const priceText = toLatin(tier.price);
    const priceWidth = serifBold.widthOfTextAtSize(priceText, 18);
    page.drawText(priceText, {
      x: A4.w - colLeftX - priceWidth, y: cursorY, size: 18, font: serifBold, color: CHARCOAL,
    });
    cursorY -= 16;
    page.drawText(tier.tagline, {
      x: colLeftX, y: cursorY, size: 10, font: serif, color: MUTED,
    });

    cursorY -= 22;
    page.drawText(`Lead time  ${tier.lead}    ·    Fittings  ${tier.fittings}`, {
      x: colLeftX, y: cursorY, size: 9, font: sans, color: CHARCOAL,
    });

    cursorY -= 18;
    for (const f of tier.features) {
      page.drawText(`·  ${f}`, {
        x: colLeftX + 8, y: cursorY, size: 9.5, font: sans, color: CHARCOAL,
      });
      cursorY -= 14;
    }
  } else {
    ensure(30 + 28 + 16 + 18);
    cursorY -= 30;
    drawSectionHeader(page, "COMMISSION", colLeftX, cursorY, serifBold);
    cursorY -= 28;
    page.drawText(`MADE TO MEASURE ${category.toUpperCase()}`, {
      x: colLeftX, y: cursorY, size: 18, font: serif, color: BURGUNDY,
    });
    cursorY -= 16;
    page.drawText("Priced per specification  ·  2–3 weeks", {
      x: colLeftX, y: cursorY, size: 10, font: serif, color: MUTED,
    });
    cursorY -= 18;
  }

  // ── Footer on the final content page ────────────────────────────────────
  drawFooter(page);
  void colMidX; // kept for future split-column layouts

  // ── Optional measurements page ─────────────────────────────────────────
  const measurementValues = extras?.measurements ?? {};
  const unit = extras?.unit ?? "cm";
  const hasAnyMeasurement = Object.values(measurementValues).some((v) => (v ?? "").trim() !== "");

  if (hasAnyMeasurement) {
    const m = pdf.addPage([A4.w, A4.h]);
    m.drawRectangle({ x: 0, y: 0, width: A4.w, height: A4.h, color: IVORY_BG });

    if (logoImage) {
      const targetH = 56;
      const ratio = targetH / logoImage.height;
      m.drawImage(logoImage, {
        x: A4.w / 2 - (logoImage.width * ratio) / 2,
        y: A4.h - 100,
        width: logoImage.width * ratio,
        height: targetH,
      });
    }

    centerText(m, "BESPOKE SPECIFICATION", A4.h - 160, {
      font: sans, size: 8, color: MUTED, tracking: 3,
    });
    centerText(m, "Your measurements", A4.h - 192, {
      font: serif, size: 22, color: CHARCOAL,
    });
    centerText(m, `All values in ${unit === "cm" ? "centimetres" : "inches"}`, A4.h - 214, {
      font: sans, size: 9, color: MUTED, tracking: 1.5,
    });
    drawRule(m, A4.w / 2 - 40, A4.h - 236, 80);

    let mY = A4.h - 270;
    const mLeftX = colLeftX;
    const mRowH  = 18;

    for (const group of measurementGroupsForCategory(category)) {
      drawSectionHeader(m, group.title.toUpperCase(), mLeftX, mY, serifBold);
      mY -= 18;
      drawRule(m, mLeftX, mY, A4.w - mLeftX * 2);
      mY -= 16;

      for (const it of group.items) {
        const raw = (measurementValues[it.slug] ?? "").trim();
        // Render label always — keeps the form readable at fitting.
        m.drawText(it.label, {
          x: mLeftX, y: mY, size: 9.5, font: sans, color: MUTED,
        });
        const valStr = raw ? `${raw}  ${unit}` : "—";
        const valWidth = serifBold.widthOfTextAtSize(valStr, 11);
        m.drawText(valStr, {
          x: A4.w - mLeftX - valWidth,
          y: mY,
          size: 11,
          font: serifBold,
          color: raw ? CHARCOAL : MUTED,
        });
        mY -= mRowH;
      }
      mY -= 14;
    }

    drawRule(m, mLeftX, 90, A4.w - mLeftX * 2);
    centerText(m, "HILTON MADE TO MEASURE", 72, {
      font: sans, size: 8, color: BURGUNDY, tracking: 3,
    });
    centerText(m, "Shop No. 119, Shaikh Abdulla Avenue  ·  Manama, Kingdom of Bahrain", 58, {
      font: sans, size: 8, color: MUTED, tracking: 1.5,
    });
    centerText(m, "atelier@hiltonmtm.com  ·  +973 17 245 689", 46, {
      font: sans, size: 8, color: MUTED, tracking: 1.5,
    });
  }

  return pdf.save();
}

/* ──────────────────────────── helpers ──────────────────────────── */

function centerText(
  page: ReturnType<PDFDocument["addPage"]>,
  text: string,
  y: number,
  opts: { font: import("pdf-lib").PDFFont; size: number; color: ReturnType<typeof rgb>; tracking?: number },
) {
  const { font, size, color, tracking = 0 } = opts;
  if (tracking === 0) {
    const w = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: A4.w / 2 - w / 2, y, size, font, color });
    return;
  }
  // letter-spaced rendering
  const chars = Array.from(text);
  const widths = chars.map((c) => font.widthOfTextAtSize(c, size));
  const total = widths.reduce((s, w) => s + w, 0) + tracking * (chars.length - 1);
  let x = A4.w / 2 - total / 2;
  chars.forEach((c, i) => {
    page.drawText(c, { x, y, size, font, color });
    x += widths[i] + tracking;
  });
}

function drawRule(
  page: ReturnType<PDFDocument["addPage"]>,
  x: number,
  y: number,
  width: number,
) {
  page.drawLine({
    start: { x, y },
    end:   { x: x + width, y },
    thickness: 0.5,
    color: RULE,
    opacity: 0.25,
  });
}

function drawSectionHeader(
  page: ReturnType<PDFDocument["addPage"]>,
  text: string,
  x: number,
  y: number,
  font: import("pdf-lib").PDFFont,
) {
  page.drawText(text, { x, y, size: 9, font, color: BURGUNDY });
}
