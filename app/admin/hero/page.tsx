"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, Image as ImageIcon, Plus, Trash2, ArrowUp, ArrowDown,
  Eye, EyeOff, Upload, Save,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { isAdmin } from "@/lib/admin";
import {
  listAllHeroSlides,
  createHeroSlide,
  updateHeroSlide,
  deleteHeroSlide,
  swapHeroSlidePositions,
  type HeroSlide,
} from "@/lib/heroSlides";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-32 md:pt-40 pb-24 min-h-[80vh]">
      <div className="container-editorial">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-eyebrow text-[var(--color-charcoal-500)] hover:text-[var(--color-burgundy-700)] transition-colors mb-8"
        >
          <ArrowLeft size={14} strokeWidth={1.5} /> The atelier admin
        </Link>
        {children}
      </div>
    </div>
  );
}

export default function AdminHeroPage() {
  const { user, loading } = useAuth();
  const [admin, setAdmin] = useState<boolean | null>(null);
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [alt, setAlt] = useState("");
  const [uploading, setUploading] = useState(false);

  // Track per-row "saving alt" so the input doesn't blur on every keystroke.
  const [altDrafts, setAltDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) { setAdmin(false); return; }
    isAdmin(user.email).then(setAdmin);
  }, [user]);

  useEffect(() => {
    if (!admin) return;
    let cancelled = false;
    (async () => {
      setLoadingData(true);
      try {
        const rows = await listAllHeroSlides();
        if (!cancelled) {
          setSlides(rows);
          setAltDrafts(Object.fromEntries(rows.map((r) => [r.id, r.alt ?? ""])));
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load slides.");
      } finally {
        if (!cancelled) setLoadingData(false);
      }
    })();
    return () => { cancelled = true; };
  }, [admin]);

  function pickFile(f: File | null) {
    setFile(f);
    setFilePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return f ? URL.createObjectURL(f) : null;
    });
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setError(null);
    const { data, error: err } = await createHeroSlide(file, alt);
    if (err || !data) {
      setError(err ?? "Couldn't add slide.");
      setUploading(false);
      return;
    }
    setSlides((prev) => [...prev, data]);
    setAltDrafts((prev) => ({ ...prev, [data.id]: data.alt ?? "" }));
    pickFile(null);
    setAlt("");
    setUploading(false);
  }

  async function handleToggleActive(row: HeroSlide) {
    const next = !row.active;
    setSlides((prev) => prev.map((r) => (r.id === row.id ? { ...r, active: next } : r)));
    const { error: err } = await updateHeroSlide(row.id, { active: next });
    if (err) {
      // revert
      setSlides((prev) => prev.map((r) => (r.id === row.id ? { ...r, active: row.active } : r)));
      setError(err);
    }
  }

  async function handleDelete(row: HeroSlide) {
    if (!confirm("Remove this slide from the homepage banner? The image stays in your media library.")) return;
    const { error: err } = await deleteHeroSlide(row.id);
    if (err) { setError(err); return; }
    setSlides((prev) => prev.filter((r) => r.id !== row.id));
  }

  async function handleSaveAlt(row: HeroSlide) {
    const value = (altDrafts[row.id] ?? "").trim();
    const { error: err } = await updateHeroSlide(row.id, { alt: value || null });
    if (err) { setError(err); return; }
    setSlides((prev) => prev.map((r) => (r.id === row.id ? { ...r, alt: value || null } : r)));
  }

  async function handleMove(row: HeroSlide, direction: "up" | "down") {
    const index = slides.findIndex((r) => r.id === row.id);
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= slides.length) return;
    const other = slides[swapIndex];
    const next = [...slides];
    next[index] = other;
    next[swapIndex] = row;
    setSlides(next);
    const { error: err } = await swapHeroSlidePositions(row, other);
    if (err) { setError(err); }
  }

  const activeCount = useMemo(() => slides.filter((s) => s.active).length, [slides]);

  if (loading || admin === null) {
    return <Shell><p className="text-eyebrow text-[var(--color-charcoal-500)]">Loading…</p></Shell>;
  }
  if (!user) {
    return (
      <Shell>
        <h1 className="text-display text-[clamp(2rem,4vw,3rem)]">Access restricted</h1>
        <p className="mt-4 text-[0.95rem] text-[var(--color-charcoal-700)]">
          Please <Link href="/account" className="text-[var(--color-burgundy-700)] underline">sign in</Link> with an admin account.
        </p>
      </Shell>
    );
  }
  if (!admin) {
    return (
      <Shell>
        <h1 className="text-display text-[clamp(2rem,4vw,3rem)]">Access restricted</h1>
        <p className="mt-4 text-[0.95rem] text-[var(--color-charcoal-700)]">
          This area is reserved for the atelier. If you have an account here, please continue shopping or visit <Link href="/account" className="text-[var(--color-burgundy-700)] underline">your account</Link> instead.
        </p>
      </Shell>
    );
  }

  return (
    <Shell>
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 border-b border-black/10 pb-8">
        <div>
          <h1 className="text-display text-[clamp(2rem,4vw,3rem)] leading-tight inline-flex items-center gap-3">
            <ImageIcon size={26} strokeWidth={1.5} className="text-[var(--color-burgundy-700)]" />
            Homepage hero banner
          </h1>
          <p className="mt-3 text-[0.9rem] text-[var(--color-charcoal-500)] max-w-2xl">
            Slides shown across the top of the homepage. The banner advances every four seconds.
            Drag, toggle, or upload to control what visitors see first.
            {activeCount > 0 && <> Currently {activeCount} active slide{activeCount === 1 ? "" : "s"}.</>}
          </p>
        </div>
      </header>

      {error && (
        <p className="mt-6 text-[0.85rem] text-[var(--color-burgundy-700)] bg-[var(--color-burgundy-50)] border border-[var(--color-burgundy-700)]/20 px-3 py-2">
          {error}
        </p>
      )}

      {/* Upload card */}
      <section className="mt-10 border border-black/10 bg-[var(--color-ivory-100)]">
        <div className="px-6 py-4 border-b border-black/10">
          <h2 className="text-eyebrow text-[var(--color-burgundy-700)] inline-flex items-center gap-2">
            <Plus size={14} strokeWidth={1.5} /> Add a slide
          </h2>
        </div>
        <div className="px-6 py-6 grid grid-cols-1 md:grid-cols-[200px_1fr_auto] gap-5 items-start">
          <label
            htmlFor="hero-slide-upload"
            className="relative block aspect-[3/2] border border-dashed border-black/20 bg-white/40 hover:border-[var(--color-burgundy-700)]/50 transition-colors cursor-pointer overflow-hidden"
          >
            {filePreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={filePreview} alt="" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--color-charcoal-500)]">
                <Upload size={20} strokeWidth={1.5} />
                <span className="mt-1.5 text-[0.65rem] uppercase tracking-[0.18em]">Choose image</span>
                <span className="text-[0.62rem] text-[var(--color-charcoal-500)] mt-0.5">Recommended 2400 × 1500</span>
              </div>
            )}
          </label>
          <input
            id="hero-slide-upload"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => pickFile(e.currentTarget.files?.[0] ?? null)}
          />
          <div>
            <label className="block">
              <span className="text-eyebrow text-[var(--color-charcoal-500)]">Alt text (optional)</span>
              <input
                type="text"
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                placeholder="What's in this photograph"
                className="mt-2 w-full bg-white border border-black/15 px-3 py-2.5 text-[0.95rem] focus:outline-none focus:border-[var(--color-burgundy-700)]"
              />
              <span className="block mt-1.5 text-[0.7rem] text-[var(--color-charcoal-500)]">
                Helps screen readers and search engines describe the photograph.
              </span>
            </label>
          </div>
          <div className="md:pt-[1.45rem]">
            <button
              type="button"
              onClick={handleUpload}
              disabled={!file || uploading}
              className="text-eyebrow inline-flex items-center justify-center gap-2 bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] px-5 py-2.5 hover:bg-[var(--color-burgundy-800)] transition-colors disabled:opacity-50"
            >
              <Save size={13} strokeWidth={1.5} /> {uploading ? "Uploading…" : "Add to banner"}
            </button>
          </div>
        </div>
      </section>

      {/* Slide list */}
      <section className="mt-10">
        <h2 className="text-eyebrow text-[var(--color-charcoal-500)] mb-5">Slides in order</h2>
        {loadingData ? (
          <p className="text-eyebrow text-[var(--color-charcoal-500)]">Loading…</p>
        ) : slides.length === 0 ? (
          <div className="border border-black/10 bg-[var(--color-ivory-200)] px-6 py-8 text-[0.9rem] text-[var(--color-charcoal-700)]">
            No slides yet. The homepage will keep showing the default hero image until you add at least one.
          </div>
        ) : (
          <ul className="space-y-3">
            {slides.map((row, i) => (
              <li
                key={row.id}
                className={`border ${row.active ? "border-black/10 bg-white" : "border-black/10 bg-[var(--color-ivory-200)] opacity-70"} p-4 grid grid-cols-12 gap-4 items-center`}
              >
                <div className="col-span-12 sm:col-span-3 relative aspect-[3/2] overflow-hidden bg-[var(--color-ivory-200)]">
                  <Image
                    src={row.image_url}
                    alt={row.alt ?? ""}
                    fill
                    sizes="240px"
                    className="object-cover"
                    unoptimized={row.image_url.includes("erp.hiltontailoringhouse.com")}
                  />
                </div>
                <div className="col-span-12 sm:col-span-6">
                  <div className="text-eyebrow text-[var(--color-burgundy-700)] mb-1.5">
                    Slide {i + 1}{!row.active && " · Hidden"}
                  </div>
                  <label className="block">
                    <span className="text-eyebrow text-[var(--color-charcoal-500)]">Alt text</span>
                    <input
                      type="text"
                      value={altDrafts[row.id] ?? ""}
                      onChange={(e) => setAltDrafts((p) => ({ ...p, [row.id]: e.target.value }))}
                      onBlur={() => handleSaveAlt(row)}
                      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                      placeholder="What's in this photograph"
                      className="mt-1.5 w-full bg-white border border-black/15 px-3 py-2 text-[0.9rem] focus:outline-none focus:border-[var(--color-burgundy-700)]"
                    />
                  </label>
                </div>
                <div className="col-span-12 sm:col-span-3 flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => handleMove(row, "up")}
                    disabled={i === 0}
                    aria-label="Move up"
                    className="text-eyebrow inline-flex items-center gap-1.5 border border-black/15 px-2.5 py-2 hover:border-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-700)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ArrowUp size={12} strokeWidth={1.5} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(row, "down")}
                    disabled={i === slides.length - 1}
                    aria-label="Move down"
                    className="text-eyebrow inline-flex items-center gap-1.5 border border-black/15 px-2.5 py-2 hover:border-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-700)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ArrowDown size={12} strokeWidth={1.5} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleActive(row)}
                    aria-label={row.active ? "Hide" : "Show"}
                    className="text-eyebrow inline-flex items-center gap-1.5 border border-black/15 px-2.5 py-2 hover:border-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-700)] transition-colors"
                  >
                    {row.active ? <Eye size={12} strokeWidth={1.5} /> : <EyeOff size={12} strokeWidth={1.5} />}
                    {row.active ? "Hide" : "Show"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(row)}
                    aria-label="Remove slide"
                    className="text-eyebrow inline-flex items-center gap-1.5 border border-black/15 px-2.5 py-2 text-[var(--color-charcoal-500)] hover:border-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-700)] transition-colors"
                  >
                    <Trash2 size={12} strokeWidth={1.5} /> Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Shell>
  );
}
