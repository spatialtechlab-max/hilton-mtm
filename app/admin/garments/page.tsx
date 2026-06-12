"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, ArrowUpDown, Upload, RotateCcw, RefreshCw, Check } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { isAdmin } from "@/lib/admin";
import {
  fetchGarments, upsertGarment,
  libraryCoverSlotForGarment, librarySlugForGarment,
  type Garment,
} from "@/lib/garments";
import { libraries } from "@/lib/libraries";
import {
  fetchAllMediaSlots, upsertMediaSlot, deleteMediaSlot, uploadEditorialImage,
  type MediaOverride,
} from "@/lib/media";
import { supabase } from "@/lib/supabase";

/**
 * Garment management. The atelier rotates commissions seasonally
 * (overcoat in winter, chino pants in summer, tuxedo for the wedding
 * season, etc.) — this page lets them add / disable / reorder garments
 * without a code change.
 *
 * Adding a garment alone doesn't pull any steps into its flow yet; the
 * admin then opens the relevant steps in /admin and ticks the new slug
 * into each step's `applies_to`. That keeps step-level configuration
 * the single source of truth for the wizard sequence.
 */
export default function AdminGarmentsPage() {
  const { user, loading } = useAuth();
  const [admin, setAdmin] = useState<boolean | null>(null);

  const [garments, setGarments] = useState<Garment[]>([]);
  // Cover photo per garment, keyed by library.<slug>.cover slot. Same
  // slot the homepage Categories tile and library hero already read,
  // so an upload here shows on all three surfaces.
  const [covers, setCovers] = useState<Record<string, MediaOverride>>({});
  // Live ERP active-item count per categoryName (uppercased). Lets each
  // garment row show how many products the ERP currently carries under
  // its mapped categories.
  const [erpCounts, setErpCounts] = useState<Record<string, number>>({});
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ added: number; message: string } | null>(null);

  async function syncFromErp(opts: { silent?: boolean } = {}) {
    setSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? "";
      const res = await fetch("/api/admin/sync-erp-garments", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? "Sync failed.");
      const added = (body.added ?? []).length;
      if (added > 0) {
        const labels = body.added.map((a: { label: string }) => a.label).join(", ");
        setSyncResult({ added, message: `Found ${added} new ERP categor${added === 1 ? "y" : "ies"}: ${labels}. Added as Hidden so you can review.` });
      } else if (!opts.silent) {
        setSyncResult({ added: 0, message: "No new garment categories in the ERP." });
      }
    } catch (e) {
      if (!opts.silent) setError(e instanceof Error ? e.message : "ERP sync failed.");
    } finally {
      setSyncing(false);
    }
  }

  useEffect(() => {
    if (!user) { setAdmin(false); return; }
    isAdmin(user.email).then(setAdmin);
  }, [user]);

  async function load() {
    setLoadingData(true);
    setError(null);
    try {
      const [g, m, counts] = await Promise.all([
        fetchGarments(),
        fetchAllMediaSlots().catch(() => ({} as Record<string, MediaOverride>)),
        fetch("/api/erp-categories", { cache: "no-store" })
          .then((r) => r.json())
          .then((d) => (d?.counts ?? {}) as Record<string, number>)
          .catch(() => ({} as Record<string, number>)),
      ]);
      setGarments(g);
      setCovers(m);
      setErpCounts(counts);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load garments.");
    } finally {
      setLoadingData(false);
    }
  }

  async function uploadCover(slug: string, file: File) {
    setBusy(slug);
    setError(null);
    try {
      const url = await uploadEditorialImage(file);
      const slot = libraryCoverSlotForGarment(slug);
      const alt = garments.find((g) => g.slug === slug)?.label ?? slug;
      const { error: e } = await upsertMediaSlot(slot, url, alt);
      if (e) throw new Error(e);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(null);
    }
  }

  async function clearCover(slug: string) {
    setBusy(slug);
    setError(null);
    try {
      const slot = libraryCoverSlotForGarment(slug);
      const { error: e } = await deleteMediaSlot(slot);
      if (e) throw new Error(e);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Clear failed.");
    } finally {
      setBusy(null);
    }
  }
  useEffect(() => {
    if (!admin) return;
    // Sync new ERP categories first, then load the table. Silent on
    // page-load — we surface a banner only if something was added.
    syncFromErp({ silent: true }).then(() => load());
  }, [admin]);

  async function patch(slug: string, partial: Partial<Garment>) {
    const current = garments.find((g) => g.slug === slug);
    if (!current) return;
    setBusy(slug);
    const { error: e } = await upsertGarment({ ...current, ...partial });
    setBusy(null);
    if (e) { setError(e); return; }
    setGarments((arr) => arr.map((g) => (g.slug === slug ? { ...g, ...partial } : g)));
  }

  if (loading || admin === null) return <Shell><p className="text-eyebrow text-[var(--color-charcoal-500)]">Loading…</p></Shell>;
  if (!user)  return <Shell><p>Sign in required.</p></Shell>;
  if (!admin) return <Shell><p>Not authorised.</p></Shell>;

  return (
    <Shell>
      <header className="mb-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-eyebrow text-[var(--color-burgundy-700)]">Admin · Garments</span>
            <h1 className="text-display text-[clamp(2rem,4vw,3rem)] mt-2 leading-tight">Atelier offerings</h1>
            <p className="mt-3 text-[0.9rem] text-[var(--color-charcoal-500)] max-w-2xl">
              Garments come straight from the ERP: add a category there, hit Sync, and the new row appears
              here as Hidden. Flip it Live to open its shelf and customizer, then curate its steps in
              <Link href="/admin" className="underline ml-1">customization options</Link>.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => { setSyncResult(null); syncFromErp().then(() => load()); }}
              disabled={syncing}
              className="text-eyebrow inline-flex items-center gap-2 border border-[var(--color-burgundy-700)] text-[var(--color-burgundy-700)] px-4 py-2.5 hover:bg-[var(--color-burgundy-700)] hover:text-[var(--color-ivory-100)] transition-colors disabled:opacity-50"
            >
              <RefreshCw size={13} strokeWidth={1.5} className={syncing ? "animate-spin" : ""} />
              {syncing ? "Syncing…" : "Sync from ERP"}
            </button>
            <Link href="/admin" className="text-eyebrow inline-flex items-center gap-2 border border-black/15 px-4 py-2.5 hover:border-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-700)] transition-colors">
              Customizer options
            </Link>
            <Link href="/admin/orders" className="text-eyebrow inline-flex items-center gap-2 border border-black/15 px-4 py-2.5 hover:border-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-700)] transition-colors">
              Orders
            </Link>
            <Link href="/admin/users" className="text-eyebrow inline-flex items-center gap-2 border border-black/15 px-4 py-2.5 hover:border-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-700)] transition-colors">
              Users
            </Link>
          </div>
        </div>
        {syncResult && (
          <p className="mt-5 inline-flex items-center gap-2 text-[0.82rem] text-[var(--color-burgundy-700)] bg-[var(--color-burgundy-50)] border border-[var(--color-burgundy-700)]/20 px-3 py-2">
            <Check size={14} strokeWidth={1.5} />
            {syncResult.message}
          </p>
        )}
      </header>

      {error && (
        <p className="mb-4 text-[0.85rem] text-[var(--color-burgundy-700)] bg-[var(--color-burgundy-50)] border border-[var(--color-burgundy-700)]/20 px-3 py-2">
          {error}
        </p>
      )}

      {loadingData ? (
        <p className="text-eyebrow text-[var(--color-charcoal-500)]">Loading…</p>
      ) : garments.length === 0 ? (
        <p className="text-[var(--color-charcoal-700)] border border-black/10 p-8 bg-[var(--color-ivory-200)]">
          No garments yet. Add one above — Suit / Jacket / Shirt / Trouser will appear automatically once the
          <code className="mx-1 text-[0.82rem]">supabase/migrations/20260603100000_garments.sql</code>
          migration has been run.
        </p>
      ) : (
        <ul className="border-y border-black/10 divide-y divide-black/10">
          {garments.map((g) => {
            const cover = covers[libraryCoverSlotForGarment(g.slug)];
            // The storefront default intro (from lib/libraries.ts) for this
            // garment's library. Shown in the textarea when the atelier
            // hasn't written its own copy yet, so the live text is visible
            // and editable here instead of an empty box.
            const defaultIntro = libraries[librarySlugForGarment(g.slug)]?.intro ?? "";
            const introValue = g.description ?? defaultIntro;
            // Live ERP products under this garment's mapped categories.
            const erpCount = (g.erp_categories ?? []).reduce(
              (n, cat) => n + (erpCounts[(cat || "").trim().toUpperCase()] ?? 0),
              0,
            );
            return (
            <li key={g.slug} className="grid grid-cols-12 gap-3 items-center py-4 px-2">
              {/* Cover thumbnail + upload — writes to the unified
                  library.<slug>.cover slot so the same image shows on
                  the Categories tile, the library hero, and the Design
                  Yours picker. */}
              <div className="col-span-12 sm:col-span-2 flex items-center gap-2">
                <div className="relative w-16 h-16 shrink-0 overflow-hidden bg-[var(--color-ivory-200)] border border-black/10">
                  {cover?.url ? (
                    <Image src={cover.url} alt={g.label} fill sizes="64px" className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[0.55rem] tracking-[0.15em] uppercase text-[var(--color-charcoal-400)] text-center px-1">
                      No cover
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    className={`text-[0.6rem] tracking-[0.15em] uppercase inline-flex items-center gap-1 border border-[var(--color-burgundy-700)] text-[var(--color-burgundy-700)] px-2 py-1 cursor-pointer hover:bg-[var(--color-burgundy-700)] hover:text-[var(--color-ivory-100)] transition-colors ${busy === g.slug ? "opacity-50 pointer-events-none" : ""}`}
                  >
                    <Upload size={10} strokeWidth={1.5} />
                    {busy === g.slug ? "Uploading…" : cover?.url ? "Replace" : "Upload"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCover(g.slug, f); e.target.value = ""; }}
                      className="hidden"
                    />
                  </label>
                  {cover?.url && (
                    <button
                      type="button"
                      onClick={() => clearCover(g.slug)}
                      aria-label="Clear cover image"
                      className="text-[0.58rem] tracking-[0.15em] uppercase inline-flex items-center gap-1 text-[var(--color-charcoal-500)] hover:text-[var(--color-burgundy-700)] transition-colors"
                    >
                      <RotateCcw size={9} strokeWidth={1.5} /> Clear
                    </button>
                  )}
                </div>
              </div>
              <div className="col-span-12 sm:col-span-3">
                <input
                  type="text"
                  value={g.label}
                  onChange={(e) => patch(g.slug, { label: e.target.value })}
                  className="w-full text-display text-[1.1rem] bg-transparent border-b border-transparent hover:border-black/20 focus:border-[var(--color-burgundy-700)] focus:outline-none px-1 py-0.5"
                />
                <p className="text-[0.7rem] text-[var(--color-charcoal-500)] mt-1 tabular-nums">slug · {g.slug}</p>
              </div>
              <div className="col-span-8 sm:col-span-2">
                <input
                  type="text"
                  value={g.season_note}
                  onChange={(e) => patch(g.slug, { season_note: e.target.value })}
                  placeholder="Season note"
                  className="w-full text-[0.85rem] bg-transparent border-b border-transparent hover:border-black/20 focus:border-[var(--color-burgundy-700)] focus:outline-none px-1 py-0.5 text-[var(--color-charcoal-700)]"
                />
              </div>
              <div className="col-span-4 sm:col-span-1 inline-flex items-center gap-1 text-[0.78rem] text-[var(--color-charcoal-500)]">
                <ArrowUpDown size={12} strokeWidth={1.5} />
                <input
                  type="number"
                  value={g.position}
                  onChange={(e) => patch(g.slug, { position: Number(e.target.value) || 0 })}
                  className="w-12 bg-transparent border-b border-transparent hover:border-black/20 focus:border-[var(--color-burgundy-700)] focus:outline-none tabular-nums text-right"
                />
              </div>
              <div className="col-span-6 sm:col-span-2 flex flex-col items-start sm:items-center justify-center">
                <span className="text-[1.1rem] text-display tabular-nums text-[var(--color-charcoal-900)] leading-none">{erpCount}</span>
                <span className="text-[0.58rem] tracking-[0.15em] uppercase text-[var(--color-charcoal-400)] mt-1">in ERP</span>
              </div>
              <div className="col-span-6 sm:col-span-2 flex items-center justify-end gap-3">
                {/* Drives everything tier-related for this garment: the
                    Essentials / Signature / Bespoke picker on the
                    storefront, plus its generated Pricing and Tier copy
                    groups in /admin/settings. Off = a flat made-to-measure
                    flow (shoes, belts, ties). */}
                <label className="inline-flex items-center gap-1.5 text-[0.7rem] tracking-[0.1em] uppercase text-[var(--color-charcoal-600)]" title="Show the Essentials / Signature / Full Bespoke picker for this garment">
                  <input
                    type="checkbox"
                    checked={g.has_tiers}
                    onChange={(e) => patch(g.slug, { has_tiers: e.target.checked })}
                  /> Tiers
                </label>
                <button
                  type="button"
                  onClick={() => patch(g.slug, { active: !g.active })}
                  className="text-eyebrow inline-flex items-center gap-1.5 px-3 py-1.5 border border-black/15 hover:border-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-700)] transition-colors"
                >
                  {g.active ? <><Eye size={12} strokeWidth={1.5} /> Live</> : <><EyeOff size={12} strokeWidth={1.5} /> Hidden</>}
                </button>
              </div>
              {/* Library description — the long copy under the library
                  hero on /library/<slug>. Empty = the storefront keeps
                  the existing default copy. Saves on blur so the
                  atelier doesn't have to hunt for a Save button. */}
              <div className="col-span-12 mt-1">
                <label className="block">
                  <span className="text-eyebrow text-[0.6rem] text-[var(--color-charcoal-500)]">
                    Library description
                    <span className="ml-2 normal-case tracking-normal text-[var(--color-charcoal-400)]">
                      {g.description == null ? "showing storefront default — edit to override" : "custom override (live)"}
                    </span>
                  </span>
                  <textarea
                    rows={Math.min(6, Math.max(2, introValue.split("\n").length + 1))}
                    value={introValue}
                    onChange={(e) => patch(g.slug, { description: e.target.value })}
                    placeholder="Shown under the library title on /library/<slug>."
                    className="mt-1.5 w-full bg-white border border-black/10 hover:border-black/25 focus:border-[var(--color-burgundy-700)] focus:outline-none px-3 py-2 text-[0.85rem] leading-relaxed resize-y"
                  />
                </label>
              </div>
            </li>
            );
          })}
        </ul>
      )}

      <p className="mt-8 text-[0.78rem] text-[var(--color-charcoal-500)] leading-relaxed max-w-2xl">
        <strong className="text-[var(--color-charcoal-900)]">Position</strong> controls the order across the Design Yours
        landing tiles and the customizer sidebar (lower number = earlier).
        <strong className="text-[var(--color-charcoal-900)]"> Tiers</strong> shows the Essentials / Signature / Full Bespoke
        picker for that garment and unlocks its Pricing + Tier copy groups in Settings; off = a flat made-to-measure flow.
        <strong className="text-[var(--color-charcoal-900)]"> Hidden</strong> keeps the slug + step assignments alive but
        removes the garment from the storefront, and from Customization options. Handy for seasonal rotations.
      </p>
    </Shell>
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
