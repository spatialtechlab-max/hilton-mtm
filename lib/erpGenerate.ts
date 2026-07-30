/**
 * Server-only AI image generation for ERP items that have data but no photos.
 *
 * Given an uploaded fabric photo and the item's ERP category, we produce 3
 * white-background images: a clean fabric swatch, the garment front, and the
 * garment back. Front/back copy the pose of an existing photographed item in
 * the same category (the "donor"); overcoats (which have no photographed item
 * yet) fall back to a jacket/suit donor. Model: google/gemini-3-pro-image.
 *
 * The OpenRouter key is read from OPENROUTER_API_KEY (server env, never the
 * public repo).
 */
const OR_KEY = process.env.OPENROUTER_API_KEY ?? "";
const MODEL = "google/gemini-3-pro-image";

export type Garment = { type: string; label: string };

/** ERP categoryName (uppercased) → garment. Anything NOT here is an accessory
 *  (tie, belt, shoes, cufflink…) and is never generated. */
export const GARMENT_BY_CATEGORY: Record<string, Garment> = {
  SUITING:       { type: "suit",     label: "men's suit jacket" },
  SUITINGS:      { type: "suit",     label: "men's suit jacket" },
  SUITS:         { type: "suit",     label: "men's suit jacket" },
  JACKETING:     { type: "jacket",   label: "men's sport jacket / blazer" },
  JACKET:        { type: "jacket",   label: "men's sport jacket / blazer" },
  BLAZER:        { type: "jacket",   label: "men's blazer" },
  OVERCOAT:      { type: "overcoat", label: "men's tailored overcoat" },
  PANTS:         { type: "trouser",  label: "pair of men's tailored trousers" },
  "CHINO PANTS": { type: "trouser",  label: "pair of men's chino trousers" },
  TROUSER:       { type: "trouser",  label: "pair of men's tailored trousers" },
  SHIRTING:      { type: "shirt",    label: "men's tailored dress shirt" },
  SHIRTS:        { type: "shirt",    label: "men's tailored dress shirt" },
};

/** Donor categories to borrow a pose from when the item's own category has no
 *  photographed reference yet. */
const DONOR_FALLBACK: Record<string, string[]> = {
  OVERCOAT: ["JACKETING", "SUITING"],
};

const up = (s: string | undefined) => (s || "").trim().toUpperCase();

export function garmentForCategory(categoryName: string | undefined): Garment | null {
  return GARMENT_BY_CATEGORY[up(categoryName)] ?? null;
}

type ErpLike = { categoryName?: string; images?: string[] };
const httpImgs = (it: ErpLike) => (it.images ?? []).filter((u) => typeof u === "string" && /^https?:\/\//i.test(u));
const frontOf = (it: ErpLike) => httpImgs(it).find((u) => /_pic1_/.test(u)) ?? httpImgs(it)[0] ?? null;
const backOf  = (it: ErpLike) => httpImgs(it).find((u) => /_pic2_|_pic3_/.test(u)) ?? null;

/** A photographed reference (front + back URLs) for the item's category, or a
 *  fallback category. Returns nulls if nothing in the ERP can serve as a pose. */
export function findDonor(items: ErpLike[], categoryName: string | undefined): { front: string | null; back: string | null } {
  const cats = [up(categoryName), ...(DONOR_FALLBACK[up(categoryName)] ?? [])];
  for (const cat of cats) {
    const donors = items.filter((it) => up(it.categoryName) === cat && httpImgs(it).length > 0);
    const best = donors.find((it) => frontOf(it) && backOf(it)) ?? donors[0];
    if (best) return { front: frontOf(best), back: backOf(best) };
  }
  return { front: null, back: null };
}

// ── Prompts ──────────────────────────────────────────────────────────────
const FABRIC_FIDELITY =
  "Reproduce the SECOND image's cloth EXACTLY: same colour and warmth (do not shift the hue), same pattern at TRUE SCALE " +
  "(do not enlarge, shrink or simplify any check/stripe), same line structure and weave. The pattern must run true and aligned across the whole garment.";

function frontPrompt(label: string): string {
  return (
    `You are a luxury menswear catalogue photographer. The FIRST image is a reference product photo of a ${label} on a pure-white studio background. ` +
    "Copy its EXACT garment cut, pose, framing, styling (mannequin/shirt/tie/accessories if any) and pure-white seamless background. " +
    "The SECOND image is a fabric. Re-tailor the SAME garment entirely in that fabric. " + FABRIC_FIDELITY + " " +
    "Soft even studio lighting, sharp focus, catalogue quality, no shadow on the background, pure white (#FFFFFF) so the garment can be cleanly cut out. Output a single image only."
  );
}
function backPrompt(label: string): string {
  return (
    `You are a luxury menswear catalogue photographer. The FIRST image is the BACK-view reference of a ${label} on a pure-white studio background. ` +
    "Copy its EXACT cut, back pose, framing and pure-white seamless background. The SECOND image is a fabric. Re-tailor the SAME garment, shown from the BACK, entirely in that fabric. " +
    FABRIC_FIDELITY + " Soft even studio lighting, sharp focus, pure white (#FFFFFF) background. Output a single image only."
  );
}
function backFromFrontPrompt(label: string): string {
  return (
    `You are a luxury menswear catalogue photographer. The FIRST image is the FRONT of a ${label} on a pure-white studio background. ` +
    "Produce the BACK view of the SAME garment, same framing, same pure-white seamless background, re-tailored entirely in the SECOND image's fabric. " +
    FABRIC_FIDELITY + " Pure white (#FFFFFF) background, sharp focus. Output a single image only."
  );
}
function swatchPrompt(): string {
  return (
    "You are a textile catalogue photographer. The supplied image is a real fabric photographed by phone (it may be wrinkled, folded or unevenly lit). " +
    "Produce ONE clean studio photograph of the SAME fabric laid perfectly FLAT and smooth: no folds, no wrinkles, no shadows; lit evenly edge to edge; the cloth FILLS the entire rectangular frame (only fabric, no background). " +
    "Keep the EXACT same colour, weave and pattern at true scale, with any check/stripe lines squared to the frame. Crisp, sharp focus, true colour, premium catalogue quality. Output a single image only."
  );
}
// Ref-less fallbacks: used only when the ERP has no photographed pose to copy,
// so we can still return a front/back rather than "not generated".
function frontNoRefPrompt(label: string): string {
  return (
    `You are a luxury menswear catalogue photographer. Produce a FRONT-view studio product photo of a ${label}, tailored entirely in the supplied fabric image, ` +
    "centered and fully in frame on a pure-white (#FFFFFF) seamless background. " + FABRIC_FIDELITY + " " +
    "Soft even studio lighting, sharp focus, catalogue quality, no shadow on the background. Output a single image only."
  );
}
function backNoRefPrompt(label: string): string {
  return (
    `You are a luxury menswear catalogue photographer. Produce a BACK-view studio product photo of a ${label}, tailored entirely in the supplied fabric image, ` +
    "centered and fully in frame on a pure-white (#FFFFFF) seamless background. " + FABRIC_FIDELITY + " " +
    "Soft even studio lighting, sharp focus, catalogue quality. Output a single image only."
  );
}

// ── OpenRouter ───────────────────────────────────────────────────────────
const imgPart = (url: string) => ({ type: "image_url", image_url: { url } });
const txtPart = (text: string) => ({ type: "text", text });

async function callOpenRouter(content: unknown[]): Promise<string | null> {
  if (!OR_KEY) return null;
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OR_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://hiltonmtm.com",
        "X-Title": "Hilton MTM ERP image gen",
      },
      body: JSON.stringify({ model: MODEL, modalities: ["image", "text"], messages: [{ role: "user", content }] }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const imgs = data?.choices?.[0]?.message?.images;
    const url = Array.isArray(imgs) && imgs[0]?.image_url?.url;
    return typeof url === "string" ? url : null;
  } catch {
    return null;
  }
}

export function hasOpenRouterKey(): boolean {
  return !!OR_KEY;
}

/** Call the model, retrying transient empties/failures. A single OpenRouter call
 *  sometimes returns no image (rate limit, hiccup); without a retry that slot
 *  showed as "not generated". Up to `attempts` tries with a short backoff. */
async function callWithRetry(content: unknown[], attempts = 3): Promise<string | null> {
  for (let i = 0; i < attempts; i++) {
    const url = await callOpenRouter(content);
    if (url) return url;
    if (i < attempts - 1) await new Promise((r) => setTimeout(r, 700 * (i + 1)));
  }
  return null;
}

/** Fetch an image URL and return it as a data: URL, so the model always gets
 *  the bytes (no dependency on it fetching an external ERP URL). Falls back to
 *  the original URL if the fetch fails. */
async function toDataUrl(url: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return url;
    const ct = res.headers.get("content-type") || "image/jpeg";
    const buf = Buffer.from(await res.arrayBuffer());
    return `data:${ct};base64,${buf.toString("base64")}`;
  } catch {
    return url;
  }
}

/** Generate the 3 images for one item. fabricDataUrl is the operator's upload
 *  as a data: URL. Runs the 3 calls in parallel. Any that fail come back null. */
export async function generateThree(
  garment: Garment,
  donor: { front: string | null; back: string | null },
  fabricDataUrl: string,
): Promise<{ swatch: string | null; front: string | null; back: string | null }> {
  // Pull the reference poses down as data URLs first (robust against the model
  // not fetching external ERP URLs).
  const [frontRef, backRef] = await Promise.all([toDataUrl(donor.front), toDataUrl(donor.back)]);

  // Swatch only needs the fabric — always attempt.
  const swatchP = callWithRetry([txtPart(swatchPrompt()), imgPart(fabricDataUrl)]);

  // Front: copy a front pose if we have one, else generate ref-less so the slot
  // still fills. (We never feed a back-view image as a front reference.)
  const frontP = callWithRetry(
    frontRef
      ? [txtPart(frontPrompt(garment.label)), imgPart(frontRef), imgPart(fabricDataUrl)]
      : [txtPart(frontNoRefPrompt(garment.label)), imgPart(fabricDataUrl)],
  );

  // Back: copy a back pose, else derive from a front pose, else ref-less.
  const backP = callWithRetry(
    backRef
      ? [txtPart(backPrompt(garment.label)), imgPart(backRef), imgPart(fabricDataUrl)]
      : frontRef
        ? [txtPart(backFromFrontPrompt(garment.label)), imgPart(frontRef), imgPart(fabricDataUrl)]
        : [txtPart(backNoRefPrompt(garment.label)), imgPart(fabricDataUrl)],
  );

  const [swatch, front, back] = await Promise.all([swatchP, frontP, backP]);
  return { swatch, front, back };
}
