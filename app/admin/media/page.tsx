"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Upload, RotateCcw, Check, AlertCircle } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { isAdmin } from "@/lib/admin";
import {
  MEDIA_SLOTS, fetchAllMediaSlots, upsertMediaSlot, deleteMediaSlot,
  uploadEditorialImage,
  type MediaSlot, type MediaOverride,
} from "@/lib/media";
import { alphaKeyToPng } from "@/lib/imageKey";

/**
 * Atelier control for every editorial / cover image on the storefront —
 * homepage hero, library covers, heritage banner. Each slot in
 * MEDIA_SLOTS gets a row; admin can upload a replacement (lands in the
 * mtm-media/editorial bucket), revert to the default, or live-preview
 * the current image. The render-side <MediaImage slot=…> picks up the
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
                <MediaSlotRow
                  key={slot.key}
                  slot={slot}
                  override={overrides[slot.key]}
                  onChanged={load}
                  setError={setError}
                />
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
