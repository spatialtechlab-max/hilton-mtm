"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Check, X, Eye, EyeOff, ArrowUpDown } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { isAdmin } from "@/lib/admin";
import {
  fetchGarments, upsertGarment, deleteGarment, toSlug,
  type Garment,
} from "@/lib/garments";

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
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  // New-garment form state
  const [draftLabel, setDraftLabel] = useState("");
  const [draftSeason, setDraftSeason] = useState("");
  const [draftTiers, setDraftTiers] = useState(false);

  useEffect(() => {
    if (!user) { setAdmin(false); return; }
    isAdmin(user.email).then(setAdmin);
  }, [user]);

  async function load() {
    setLoadingData(true);
    setError(null);
    try {
      const g = await fetchGarments();
      setGarments(g);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load garments.");
    } finally {
      setLoadingData(false);
    }
  }
  useEffect(() => { if (admin) load(); }, [admin]);

  async function add() {
    const label = draftLabel.trim();
    if (!label) return;
    const slug = toSlug(label);
    const nextPos = Math.max(0, ...garments.map((g) => g.position)) + 10;
    setBusy(slug);
    const { error: e } = await upsertGarment({
      slug, label, position: nextPos,
      season_note: draftSeason.trim(),
      has_tiers: draftTiers,
      active: true,
    });
    setBusy(null);
    if (e) { setError(e); return; }
    setDraftLabel(""); setDraftSeason(""); setDraftTiers(false);
    await load();
  }

  async function patch(slug: string, partial: Partial<Garment>) {
    const current = garments.find((g) => g.slug === slug);
    if (!current) return;
    setBusy(slug);
    const { error: e } = await upsertGarment({ ...current, ...partial });
    setBusy(null);
    if (e) { setError(e); return; }
    setGarments((arr) => arr.map((g) => (g.slug === slug ? { ...g, ...partial } : g)));
  }

  async function remove(slug: string) {
    if (!confirm(`Remove garment "${slug}"? Steps tagged with this slug stay in the DB but won't render anywhere.`)) return;
    setBusy(slug);
    const { error: e } = await deleteGarment(slug);
    setBusy(null);
    if (e) { setError(e); return; }
    setGarments((arr) => arr.filter((g) => g.slug !== slug));
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
              Add, disable, or seasonally rotate the garments the storefront commissions. After adding a new
              garment here, open <Link href="/admin" className="underline">customization options</Link> and tick the
              new slug into each step that should appear in its flow.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin" className="text-eyebrow inline-flex items-center gap-2 border border-black/15 px-4 py-2.5 hover:border-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-700)] transition-colors">
              Customizer options
            </Link>
            <Link href="/admin/fabrics" className="text-eyebrow inline-flex items-center gap-2 border border-black/15 px-4 py-2.5 hover:border-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-700)] transition-colors">
              Fabrics
            </Link>
            <Link href="/admin/orders" className="text-eyebrow inline-flex items-center gap-2 border border-black/15 px-4 py-2.5 hover:border-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-700)] transition-colors">
              Orders
            </Link>
          </div>
        </div>
      </header>

      {/* Add row */}
      <div className="border border-black/10 bg-[var(--color-ivory-200)] p-5 mb-8">
        <p className="text-eyebrow text-[var(--color-charcoal-500)] mb-3 inline-flex items-center gap-2">
          <Plus size={14} strokeWidth={1.5} /> Add a garment
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <input
            type="text"
            value={draftLabel}
            onChange={(e) => setDraftLabel(e.target.value)}
            placeholder="Garment name (e.g. Overcoat, Chino Pants, Tuxedo)"
            className="sm:col-span-4 px-3 py-2.5 border border-black/15 bg-[var(--color-ivory-100)] focus:outline-none focus:border-[var(--color-burgundy-700)] text-[0.9rem]"
          />
          <input
            type="text"
            value={draftSeason}
            onChange={(e) => setDraftSeason(e.target.value)}
            placeholder="Season note (e.g. Autumn / Winter only)"
            className="sm:col-span-4 px-3 py-2.5 border border-black/15 bg-[var(--color-ivory-100)] focus:outline-none focus:border-[var(--color-burgundy-700)] text-[0.9rem]"
          />
          <label className="sm:col-span-2 inline-flex items-center gap-2 text-[0.85rem] text-[var(--color-charcoal-700)]">
            <input
              type="checkbox"
              checked={draftTiers}
              onChange={(e) => setDraftTiers(e.target.checked)}
            />
            Has tiers
          </label>
          <button
            type="button"
            onClick={add}
            disabled={!draftLabel.trim() || busy !== null}
            className="sm:col-span-2 text-eyebrow inline-flex items-center justify-center gap-2 bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] px-4 py-2.5 hover:bg-[var(--color-burgundy-800)] transition-colors disabled:opacity-50"
          >
            <Plus size={13} strokeWidth={1.5} /> Add
          </button>
        </div>
        {draftLabel && (
          <p className="text-[0.75rem] text-[var(--color-charcoal-500)] mt-2">
            slug → <code className="text-[0.78rem]">{toSlug(draftLabel)}</code>
          </p>
        )}
      </div>

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
          {garments.map((g) => (
            <li key={g.slug} className="grid grid-cols-12 gap-3 items-center py-4 px-2">
              <div className="col-span-12 sm:col-span-3">
                <input
                  type="text"
                  value={g.label}
                  onChange={(e) => patch(g.slug, { label: e.target.value })}
                  className="w-full text-display text-[1.1rem] bg-transparent border-b border-transparent hover:border-black/20 focus:border-[var(--color-burgundy-700)] focus:outline-none px-1 py-0.5"
                />
                <p className="text-[0.7rem] text-[var(--color-charcoal-500)] mt-1 tabular-nums">slug · {g.slug}</p>
              </div>
              <div className="col-span-8 sm:col-span-4">
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
              <div className="col-span-6 sm:col-span-2">
                <label className="inline-flex items-center gap-2 text-[0.82rem] text-[var(--color-charcoal-700)]">
                  <input
                    type="checkbox"
                    checked={g.has_tiers}
                    onChange={(e) => patch(g.slug, { has_tiers: e.target.checked })}
                  /> Has tiers
                </label>
              </div>
              <div className="col-span-6 sm:col-span-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => patch(g.slug, { active: !g.active })}
                  className="text-eyebrow inline-flex items-center gap-1.5 px-3 py-1.5 border border-black/15 hover:border-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-700)] transition-colors"
                >
                  {g.active ? <><Eye size={12} strokeWidth={1.5} /> Live</> : <><EyeOff size={12} strokeWidth={1.5} /> Hidden</>}
                </button>
                <button
                  type="button"
                  onClick={() => remove(g.slug)}
                  disabled={busy === g.slug}
                  aria-label={`Delete ${g.label}`}
                  className="text-[var(--color-charcoal-500)] hover:text-[var(--color-burgundy-700)] transition-colors disabled:opacity-40"
                >
                  <Trash2 size={14} strokeWidth={1.5} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-8 text-[0.78rem] text-[var(--color-charcoal-500)] leading-relaxed max-w-2xl">
        <strong className="text-[var(--color-charcoal-900)]">Position</strong> controls the order across the Design Yours
        landing tiles and the customizer sidebar (lower number = earlier).
        <strong className="text-[var(--color-charcoal-900)]"> Has tiers</strong> turns on the Essentials / Signature / Bespoke
        picker (suit + jacket use this; shirts + trousers don't).
        <strong className="text-[var(--color-charcoal-900)]"> Hidden</strong> keeps the slug + step assignments alive but
        removes the garment from the storefront — handy for seasonal rotations.
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
