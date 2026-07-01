/**
 * Premium slide-image pipeline for the Employee Learning Platform.
 *
 * For every slide in lib/learn/course.ts this generates one on-topic luxury
 * editorial image via OpenRouter (google/gemini-3-pro-image), compresses it to
 * a ~1200px JPEG (q82) with Pillow, and writes it to
 *   public/learn/<moduleSlug>-<lessonSlug>-<index>.jpg
 * where <index> is the slide's 0-based position WITHIN its lesson, matching the
 * deterministic <img src> in app/learn/[module]/page.tsx.
 *
 * Run:
 *   node scripts/genSlideImages.mjs                       # every module
 *   ONLY_MODULE=the-hilton-standard node scripts/genSlideImages.mjs   # one module
 *
 * Node 22+/24 strips the .ts types on import, so course.ts is read directly.
 * The OpenRouter key is read from .env.local (never committed).
 */
import { readFileSync, mkdirSync, existsSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import { course } from "../lib/learn/course.ts";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT_DIR = path.join(ROOT, "public", "learn");
const MODEL = "google/gemini-3-pro-image";
const CONCURRENCY = 2;
const ONLY_MODULE = (process.env.ONLY_MODULE || "").trim();

// ── Load OPENROUTER_API_KEY from .env.local ────────────────────────────────
function loadEnvKey(name) {
  const raw = readFileSync(path.join(ROOT, ".env.local"), "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 0) continue;
    if (t.slice(0, eq).trim() !== name) continue;
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    return v;
  }
  return "";
}
const OR_KEY = process.env.OPENROUTER_API_KEY || loadEnvKey("OPENROUTER_API_KEY");
if (!OR_KEY) {
  console.error("No OPENROUTER_API_KEY found (checked env + .env.local). Aborting.");
  process.exit(1);
}

// ── Prompt building ────────────────────────────────────────────────────────
const PREAMBLE =
  "Premium luxury menswear editorial photography for Hilton Bespoke, a high-end bespoke tailoring house. " +
  "Sophisticated and elegant, warm refined studio or atelier lighting, rich textures, catalogue quality, tasteful and timeless. " +
  "Absolutely no text, no letters, no words, no logos, no watermarks anywhere in the image.";

/** First 1-2 sentences of a slide body, for concrete context. */
function firstSentences(text, n = 2) {
  const parts = text.match(/[^.]+\./g);
  return (parts ? parts.slice(0, n).join(" ") : text).trim();
}

function buildPrompt(slide) {
  return (
    PREAMBLE +
    ` Depict this training concept so a viewer instantly understands it: '${slide.heading}'. ` +
    `Context: ${firstSentences(slide.body)} ` +
    "Choose one concrete, literal subject that best represents this concept (for example a tailor measuring a client with a tape, " +
    "a close-up of a jacket lapel, neatly folded cloth swatches, a confident well-dressed man, or scissors cutting cloth on a bench), " +
    "photographed realistically as a single clean scene. No collage, no diagram, no infographic, no split panels."
  );
}

// ── OpenRouter call ────────────────────────────────────────────────────────
async function callOpenRouter(prompt) {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OR_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://hiltonmtm.com",
      "X-Title": "Hilton MTM learning slide images",
    },
    body: JSON.stringify({
      model: MODEL,
      modalities: ["image", "text"],
      messages: [{ role: "user", content: [{ type: "text", text: prompt }] }],
    }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const url = data?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (typeof url !== "string") throw new Error("no image in response");
  return url;
}

function dataUrlToBuffer(url) {
  const m = /^data:([^;]+);base64,(.*)$/s.exec(url);
  if (!m) return null;
  return Buffer.from(m[2], "base64");
}

// ── Compress via Pillow ────────────────────────────────────────────────────
const PY = `
import sys, io
from PIL import Image
out = sys.argv[1]
im = Image.open(io.BytesIO(sys.stdin.buffer.read())).convert("RGB")
w, h = im.size
s = 1200 / max(w, h)
if s < 1:
    im = im.resize((round(w*s), round(h*s)), Image.LANCZOS)
im.save(out, "JPEG", quality=82, optimize=True)
print(f"{im.size[0]}x{im.size[1]}")
`.trim();

function compressToJpeg(buffer, outPath) {
  return new Promise((resolve, reject) => {
    const py = spawn("python3", ["-c", PY, outPath]);
    let out = "", err = "";
    py.stdout.on("data", (d) => (out += d));
    py.stderr.on("data", (d) => (err += d));
    py.on("error", reject);
    py.on("close", (code) => (code === 0 ? resolve(out.trim()) : reject(new Error(err || `python exit ${code}`))));
    py.stdin.on("error", () => {}); // ignore EPIPE if python dies early
    py.stdin.end(buffer);
  });
}

// ── One slide, with one retry ──────────────────────────────────────────────
async function generateSlide(job) {
  const outPath = path.join(OUT_DIR, `${job.file}.jpg`);
  if (existsSync(outPath)) { console.log(`  skip ${job.file}.jpg (exists)`); return true; }
  const prompt = buildPrompt(job.slide);
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const url = await callOpenRouter(prompt);
      const buf = dataUrlToBuffer(url);
      if (!buf) throw new Error("data url did not decode");
      const dims = await compressToJpeg(buf, outPath);
      console.log(`  ok   ${job.file}.jpg  (${dims}, ${(buf.length / 1024).toFixed(0)}KB in)`);
      return true;
    } catch (e) {
      const last = attempt === 3;
      if (!last) await new Promise((r) => setTimeout(r, 3000 * attempt));
      console.log(`  ${last ? "FAIL" : "retry"} ${job.file}.jpg  attempt ${attempt}: ${e.message}`);
      if (last) return false;
    }
  }
  return false;
}

// ── Simple concurrency pool ────────────────────────────────────────────────
async function runPool(items, limit, worker) {
  let idx = 0;
  const results = [];
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (idx < items.length) {
      const my = idx++;
      results[my] = await worker(items[my]);
    }
  });
  await Promise.all(runners);
  return results;
}

// ── Build the job list ─────────────────────────────────────────────────────
const jobs = [];
for (const mod of course.modules) {
  if (ONLY_MODULE && mod.slug !== ONLY_MODULE) continue;
  for (const lesson of mod.lessons) {
    lesson.slides.forEach((slide, i) => {
      jobs.push({ slide, file: `${mod.slug}-${lesson.slug}-${i}` });
    });
  }
}

if (jobs.length === 0) {
  console.error(ONLY_MODULE ? `No module matched ONLY_MODULE='${ONLY_MODULE}'.` : "No slides found.");
  process.exit(1);
}

mkdirSync(OUT_DIR, { recursive: true });
console.log(
  `Generating ${jobs.length} slide image(s)${ONLY_MODULE ? ` for module '${ONLY_MODULE}'` : " (all modules)"} ` +
    `at concurrency ${CONCURRENCY}...\n`,
);

const results = await runPool(jobs, CONCURRENCY, generateSlide);
const ok = results.filter(Boolean).length;
const fail = results.length - ok;
console.log(`\nDone. ${ok} succeeded, ${fail} failed, of ${jobs.length}.`);
if (fail > 0) {
  console.log("Failed slides:");
  jobs.forEach((j, i) => { if (!results[i]) console.log(`  - ${j.file}.jpg`); });
  process.exit(2);
}
