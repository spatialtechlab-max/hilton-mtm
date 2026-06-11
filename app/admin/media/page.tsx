"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Upload, RotateCcw, Check, AlertCircle, Trash2, ArrowUp, ArrowDown, Eye, EyeOff, Plus, Repeat } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { isAdmin } from "@/lib/admin";
import {
  MEDIA_SLOTS, fetchAllMediaSlots, upsertMediaSlot, deleteMediaSlot,
  uploadEditorialImage,
  type MediaSlot, type MediaOverride,
} from "@/lib/media";
import {
  listAllHeroSlides, createHeroSlide, updateHeroSlide, deleteHeroSlide,
  swapHeroSlidePositions, MAX_HERO_SLIDES, type HeroSlide,
} from "@/lib/heroSlides";
import { alphaKeyToPng } from "@/lib/imageKey";

/**
 * Atelier control for every editorial / cover image on the storefront —
 * homepage hero, library covers, heritage banner. Each slot in
 * MEDIA_SLOTS gets a row; admin can upload a replacement (lands in the
 * mtm-media/editorial bucket), revert to the default, or live-preview
 * the current image. The render-side <MediaImageClient slot=…> picks up the
 * change automatically.
 */
export default function AdminMediaPage() {
  const { user, loading } = useAuth();
  const [admin, setAdmin] = useState<boolean | null>(null);
  const [overrides, setOverrides] = useState<Record<string, MediaOverride>>({});
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setAdmin(false); return; }
    isAdmin(user.email).then(setAdmin);
  }, [user]);

  async function load() {
    setLoadingData(true);
    try {
      const map = await fetchAllMediaSlots();
      setOverrides(map);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load media overrides.");
    } finally {
      setLoadingData(false);
    }
  }
  useEffect(() => { if (admin) load(); }, [admin]);

  if (loading || admin === null) return <Shell><p className="text-eyebrow text-[var(--color-charcoal-500)]">Loading…</p></Shell>;
  if (!user)  return <Shell><p>Sign in required.</p></Shell>;
  if (!admin) return <Shell><p>Not authorised.</p></Shell>;

  const grouped = groupBy(MEDIA_SLOTS, (s) => s.group);

  return (
    <Shell>
      <header className="mb-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-eyebrow text-[var(--color-burgundy-700)]">Admin · Media</span>
            <h1 className="text-display text-[clamp(2rem,4vw,3rem)] mt-2 leading-tight">Editorial imagery</h1>
            <p className="mt-3 text-[0.9rem] text-[var(--color-charcoal-500)] max-w-2xl">
              Every cover / hero image on the storefront. Upload a replacement
              to swap it everywhere; revert to put the default back. Changes
              go live the moment the page reloads.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin" className="text-eyebrow inline-flex items-center gap-2 border border-black/15 px-4 py-2.5 hover:border-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-700)] transition-colors">
              Customizer options
            </Link>
            <Link href="/admin/garments" className="text-eyebrow inline-flex items-center gap-2 border border-black/15 px-4 py-2.5 hover:border-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-700)] transition-colors">
              Garments
            </Link>
            <Link href="/admin/fabrics" className="text-eyebrow inline-flex items-center gap-2 border border-black/15 px-4 py-2.5 hover:border-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-700)] transition-colors">
              Fabrics
            </Link>
            <Link href="/admin/orders" className="text-eyebrow inline-flex items-center gap-2 border border-black/15 px-4 py-2.5 hover:border-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-700)] transition-colors">
              Orders
            </Link>
            <Link href="/admin/users" className="text-eyebrow inline-flex items-center gap-2 border border-black/15 px-4 py-2.5 hover:border-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-700)] transition-colors">
              Users
            </Link>
          </div>
        </div>
      </header>

      {error && (
        <p className="mb-6 text-[0.85rem] text-[var(--color-burgundy-700)] bg-[var(--color-burgundy-50)] border border-[var(--color-burgundy-700)]/20 px-3 py-2 inline-flex items-center gap-2">
          <AlertCircle size={14} strokeWidth={1.5} /> {error}
        </p>
      )}

      {loadingData ? (
        <p className="text-eyebrow text-[var(--color-charcoal-500)]">Loading…</p>
      ) : (
        Object.entries(grouped).map(([group, slots]) => (
          <section key={group} className="mb-12">
            <h2 className="text-display text-[1.4rem] mb-4 text-[var(--color-charcoal-900)]">{group}</h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {slots.map((slot) => (
                slot.key === "home.hero" ? (
                  <HeroRotationRow key={slot.key} slot={slot} setError={setError} />
                ) : (
                  <MediaSlotRow
                    key={slot.key}
                    slot={slot}
                    override={overrides[slot.key]}
                    onChanged={load}
                    setError={setError}
                  />
                )
              ))}
            </ul>
          </section>
        ))
      )}
    </Shell>
  );
}

function MediaSlotRow({
  slot, override, onChanged, setError,
}: {
  slot: MediaSlot;
  override?: MediaOverride;
  onChanged: () => void;
  setError: (m: string | null) => void;
}) {
  const [busy, setBusy] = useState(false);
  const currentUrl = override?.url ?? slot.fallback;
  const currentAlt = override?.alt || slot.fallbackAlt;
  const isOverridden = Boolean(override);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      // Editorial photography — don't alpha-key it; just upload as-is.
      const url = await uploadEditorialImage(file);
      const { error } = await upsertMediaSlot(slot.key, url, slot.fallbackAlt);
      if (error) throw new Error(error);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  async function revert() {
    setBusy(true);
    setError(null);
    try {
      const { error } = await deleteMediaSlot(slot.key);
      if (error) throw new Error(error);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Revert failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="border border-black/10 bg-[var(--color-ivory-100)] flex gap-3 p-3">
      <div className="relative shrink-0 w-28 h-28 overflow-hidden bg-[var(--color-ivory-200)]">
        <Image
          src={currentUrl}
          alt={currentAlt}
          fill
          sizes="112px"
          className="object-cover"
        />
        {isOverridden && (
          <span className="absolute top-1 left-1 inline-flex items-center gap-1 bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] text-[0.55rem] tracking-[0.15em] uppercase px-1.5 py-0.5">
            <Check size={9} strokeWidth={1.8} /> Custom
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <div className="min-w-0">
          <p className="text-display text-[0.95rem] text-[var(--color-charcoal-900)] leading-tight">{slot.label}</p>
          <p className="text-[0.72rem] text-[var(--color-charcoal-500)] mt-1 leading-snug line-clamp-2">{slot.description}</p>
          <p className="text-[0.7rem] text-[var(--color-burgundy-700)] mt-1.5 font-medium tabular-nums">
            Recommended: {slot.recommendedSize} · aspect {slot.aspect}
          </p>
          <p className="text-[0.65rem] text-[var(--color-charcoal-400)] mt-1 tabular-nums truncate">{slot.key}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-auto">
          <label
            className={`text-[0.65rem] tracking-[0.15em] uppercase inline-flex items-center gap-1.5 border border-[var(--color-burgundy-700)] text-[var(--color-burgundy-700)] px-2.5 py-1.5 cursor-pointer hover:bg-[var(--color-burgundy-700)] hover:text-[var(--color-ivory-100)] transition-colors ${busy ? "opacity-50 pointer-events-none" : ""}`}
          >
            <Upload size={11} strokeWidth={1.5} />
            {busy ? "Uploading…" : isOverridden ? "Replace" : "Upload"}
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleUpload} className="hidden" />
          </label>
          {isOverridden && (
            <button
              type="button"
              onClick={revert}
              disabled={busy}
              aria-label="Revert to default"
              className="text-[0.65rem] tracking-[0.15em] uppercase inline-flex items-center gap-1.5 border border-black/15 px-2.5 py-1.5 hover:border-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-700)] transition-colors disabled:opacity-50"
            >
              <RotateCcw size={11} strokeWidth={1.5} /> Revert
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

/**
 * Special-case tile for the home.hero slot — instead of one image with
 * replace/revert, the homepage hero is a rotating banner of up to
 * MAX_HERO_SLIDES photographs. This tile spans the full row so the
 * thumbnails for every slide can sit side-by-side and the atelier can
 * reorder them without leaving the Media page.
 */
function HeroRotationRow({
  slot, setError,
}: {
  slot: MediaSlot;
  setError: (m: string | null) => void;
}) {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const rows = await listAllHeroSlides();
      setSlides(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load hero slides.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setError(null);
    const { data, error: err } = await createHeroSlide(file, slot.fallbackAlt);
    if (err || !data) { setError(err ?? "Upload failed."); setUploading(false); return; }
    setSlides((prev) => [...prev, data]);
    setUploading(false);
  }

  async function handleDelete(row: HeroSlide) {
    if (!confirm("Remove this slide from the rotating banner?")) return;
    setError(null);
    const { error: err } = await deleteHeroSlide(row.id);
    if (err) { setError(err); return; }
    setSlides((prev) => prev.filter((r) => r.id !== row.id));
  }

  async function handleToggle(row: HeroSlide) {
    const next = !row.active;
    setSlides((prev) => prev.map((r) => (r.id === row.id ? { ...r, active: next } : r)));
    const { error: err } = await updateHeroSlide(row.id, { active: next });
    if (err) {
      setSlides((prev) => prev.map((r) => (r.id === row.id ? { ...r, active: row.active } : r)));
      setError(err);
    }
  }

  async function handleMove(row: HeroSlide, direction: "up" | "down") {
    const i = slides.findIndex((r) => r.id === row.id);
    const j = direction === "up" ? i - 1 : i + 1;
    if (j < 0 || j >= slides.length) return;
    const other = slides[j];
    const next = [...slides];
    next[i] = other; next[j] = row;
    setSlides(next);
    const { error: err } = await swapHeroSlidePositions(row, other);
    if (err) setError(err);
  }

  const activeCount = slides.filter((s) => s.active).length;
  const atCap = slides.length >= MAX_HERO_SLIDES;

  return (
    <li className="md:col-span-2 xl:col-span-3 border border-black/10 bg-[var(--color-ivory-100)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <p className="text-display text-[1rem] text-[var(--color-charcoal-900)] leading-tight inline-flex items-center gap-2">
            <Repeat size={14} strokeWidth={1.5} className="text-[var(--color-burgundy-700)]" />
            {slot.label}
          </p>
          <p className="text-[0.78rem] text-[var(--color-charcoal-500)] mt-1 leading-snug max-w-2xl">
            Slides rotate every four seconds on the homepage. Add up to {MAX_HERO_SLIDES} images.
            {slides.length > 0 && <> {activeCount} of {slides.length} active.</>}
          </p>
          <p className="text-[0.7rem] text-[var(--color-burgundy-700)] mt-1.5 font-medium tabular-nums">
            Recommended: {slot.recommendedSize} · aspect {slot.aspect}
          </p>
        </div>
        <label
          className={`text-[0.65rem] tracking-[0.15em] uppercase inline-flex items-center gap-1.5 border border-[var(--color-burgundy-700)] text-[var(--color-burgundy-700)] px-3 py-2 cursor-pointer hover:bg-[var(--color-burgundy-700)] hover:text-[var(--color-ivory-100)] transition-colors ${uploading || atCap ? "opacity-50 pointer-events-none" : ""}`}
        >
          <Plus size={11} strokeWidth={1.5} />
          {uploading ? "Uploading…" : atCap ? `Limit ${MAX_HERO_SLIDES} reached` : "Add slide"}
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleUpload} className="hidden" disabled={atCap || uploading} />
        </label>
      </div>

      {loading ? (
        <p className="text-eyebrow text-[var(--color-charcoal-500)]">Loading…</p>
      ) : slides.length === 0 ? (
        <div className="border border-dashed border-black/15 bg-[var(--color-ivory-200)] px-4 py-6 text-[0.85rem] text-[var(--color-charcoal-700)]">
          No slides yet. The homepage shows the default hero image until you add at least one.
        </div>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {slides.map((row, i) => (
            <li
              key={row.id}
              className={`border ${row.active ? "border-black/10 bg-white" : "border-black/10 bg-[var(--color-ivory-200)] opacity-70"} p-2 flex flex-col gap-2`}
            >
              <div className="relative aspect-[3/2] overflow-hidden bg-[var(--color-ivory-200)]">
                <Image
                  src={row.image_url}
                  alt={row.alt ?? ""}
                  fill
                  sizes="180px"
                  className="object-cover"
                  unoptimized={row.image_url.includes("erp.hiltontailoringhouse.com")}
                />
                <span className="absolute top-1 left-1 inline-flex items-center gap-1 bg-[var(--color-charcoal-900)]/80 text-[var(--color-ivory-100)] text-[0.55rem] tracking-[0.15em] uppercase px-1.5 py-0.5">
                  {i + 1}
                </span>
                {!row.active && (
                  <span className="absolute top-1 right-1 inline-flex items-center gap-1 bg-[var(--color-charcoal-500)] text-[var(--color-ivory-100)] text-[0.55rem] tracking-[0.15em] uppercase px-1.5 py-0.5">
                    Hidden
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleMove(row, "up")}
                  disabled={i === 0}
                  aria-label="Move earlier"
                  className="inline-flex items-center justify-center border border-black/15 w-7 h-7 hover:border-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-700)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ArrowUp size={11} strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  onClick={() => handleMove(row, "down")}
                  disabled={i === slides.length - 1}
                  aria-label="Move later"
                  className="inline-flex items-center justify-center border border-black/15 w-7 h-7 hover:border-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-700)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ArrowDown size={11} strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  onClick={() => handleToggle(row)}
                  aria-label={row.active ? "Hide" : "Show"}
                  className="inline-flex items-center justify-center border border-black/15 w-7 h-7 hover:border-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-700)] transition-colors"
                >
                  {row.active ? <Eye size={11} strokeWidth={1.5} /> : <EyeOff size={11} strokeWidth={1.5} />}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(row)}
                  aria-label="Remove slide"
                  className="inline-flex items-center justify-center border border-black/15 w-7 h-7 text-[var(--color-charcoal-500)] hover:border-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-700)] transition-colors ml-auto"
                >
                  <Trash2 size={11} strokeWidth={1.5} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-32 md:pt-40 pb-24 min-h-[80vh]">
      <div className="container-editorial">
        <Link href="/" className="inline-flex items-center gap-2 text-eyebrow text-[var(--color-charcoal-500)] hover:text-[var(--color-burgundy-700)] transition-colors mb-8">
          <ArrowLeft size={14} strokeWidth={1.5} /> The House
        </Link>
        {children}
      </div>
    </div>
  );
}

function groupBy<T, K extends string>(items: T[], key: (item: T) => K): Record<K, T[]> {
  const out = {} as Record<K, T[]>;
  for (const it of items) {
    const k = key(it);
    if (!out[k]) out[k] = [];
    out[k].push(it);
  }
  return out;
}

// alphaKeyToPng is intentionally not used for editorial photography —
// these are full-bleed hero shots that should keep their backgrounds.
// Imported only to make sure the existing helper stays linkable.
void alphaKeyToPng;
