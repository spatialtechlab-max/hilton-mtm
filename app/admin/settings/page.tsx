"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, RotateCcw, AlertCircle } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { isAdmin } from "@/lib/admin";
import {
  SETTINGS, fetchAllSettings, upsertSetting, deleteSetting,
  type SettingDef,
} from "@/lib/settings";
import { fetchGarments, type Garment } from "@/lib/garments";

// Garments whose tier-price rows are hand-declared in the registry.
// Everything else Live (overcoat, tuxedo, chinos…) gets its rows
// generated below, so the atelier can price any garment's Signature /
// Full Bespoke upgrade without a code change.
const CORE_PRICED = new Set(["suit", "jacket", "shirt", "trouser"]);

function tierPriceDefsFor(g: Garment): SettingDef[] {
  return (["signature", "bespoke"] as const).map((tier) => ({
    key: `tier.price.${g.slug}.${tier}`,
    group: `Pricing — ${g.label}`,
    label: `${g.label} · ${tier === "signature" ? "Signature" : "Full Bespoke"} upgrade`,
    description: `Added to the fabric price to make the ${tier === "signature" ? "Signature" : "Full Bespoke"} commission total. Until set, the storefront shows "Price not available" for this tier.`,
    defaultValue: "",
    kind: "currency",
  }));
}

// Per-garment tier copy. Generated for EVERY Live garment whose Tiers
// toggle is on (suit, jacket, overcoat, chinos… — whatever the atelier
// hits Live). Each field overrides the shared "Tier copy" group for
// that garment only; blank = use the shared value.
const TIER_SLUGS = [
  { slug: "essential", name: "Essentials" },
  { slug: "signature", name: "Signature" },
  { slug: "bespoke",   name: "Full Bespoke" },
] as const;

function tierCopyDefsFor(g: Garment): SettingDef[] {
  const fields = [
    { field: "name",     label: "Name",          kind: "text" as const,      hint: "The headline shown on the tier card." },
    { field: "tagline",  label: "Tagline",       kind: "text" as const,      hint: "Small burgundy line shown above the name." },
    { field: "lead",     label: "Lead time",     kind: "duration" as const,  hint: "" },
    { field: "fittings", label: "Fittings",      kind: "text" as const,      hint: "" },
    { field: "features", label: "Bullet points", kind: "multiline" as const, hint: "One bullet per line. Empty lines are ignored." },
  ];
  return TIER_SLUGS.flatMap((t) =>
    fields.map((f) => ({
      key: `tier.${f.field}.${t.slug}.${g.slug}`,
      group: `Tier copy — ${g.label}`,
      label: `${t.name} · ${f.label}`,
      description: `${f.hint ? `${f.hint} ` : ""}Leave blank to use the shared Tier copy value.`,
      defaultValue: "",
      kind: f.kind,
    })),
  );
}

/**
 * Atelier-managed editorial copy + pricing. Every value declared in
 * SETTINGS shows up here as a row; admin edits it inline and saves.
 * Hitting Revert deletes the override so the storefront falls back
 * to the source default.
 */
export default function AdminSettingsPage() {
  const { user, loading } = useAuth();
  const [admin, setAdmin] = useState<boolean | null>(null);
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [garments, setGarments] = useState<Garment[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setAdmin(false); return; }
    isAdmin(user.email).then(setAdmin);
  }, [user]);

  async function load() {
    setLoadingData(true);
    try {
      const [map, g] = await Promise.all([
        fetchAllSettings(),
        fetchGarments({ activeOnly: true }).catch(() => [] as Garment[]),
      ]);
      setOverrides(map);
      setGarments(g);
      setDraft({});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load settings.");
    } finally {
      setLoadingData(false);
    }
  }
  useEffect(() => { if (admin) load(); }, [admin]);

  async function save(def: SettingDef) {
    const draftVal = draft[def.key];
    if (draftVal === undefined) return;
    if (draftVal.trim() === def.defaultValue) {
      const { error: e } = await deleteSetting(def.key);
      if (e) { setError(e); return; }
    } else {
      const { error: e } = await upsertSetting(def.key, draftVal.trim());
      if (e) { setError(e); return; }
    }
    await load();
  }

  async function revert(def: SettingDef) {
    const { error: e } = await deleteSetting(def.key);
    if (e) { setError(e); return; }
    await load();
  }

  if (loading || admin === null) return <Shell><p className="text-eyebrow text-[var(--color-charcoal-500)]">Loading…</p></Shell>;
  if (!user)  return <Shell><p>Sign in required.</p></Shell>;
  if (!admin) return <Shell><p>Not authorised.</p></Shell>;

  // Registry rows + generated groups, all driven by what the atelier has
  // made Live with the Tiers toggle on — nothing garment-specific in code:
  //   Pricing — <Garment>   (Signature / Full Bespoke upgrade amounts;
  //                          core four are hand-declared in the registry)
  //   Tier copy — <Garment> (per-garment override of the shared Tier copy)
  const tiered = garments.filter((g) => g.has_tiers);
  const dynamicDefs = [
    ...tiered.filter((g) => !CORE_PRICED.has(g.slug)).flatMap(tierPriceDefsFor),
    ...tiered.flatMap(tierCopyDefsFor),
  ];
  const grouped: Record<string, SettingDef[]> = {};
  for (const def of [...SETTINGS, ...dynamicDefs]) {
    if (!grouped[def.group]) grouped[def.group] = [];
    grouped[def.group].push(def);
  }

  return (
    <Shell>
      <header className="mb-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-eyebrow text-[var(--color-burgundy-700)]">Admin · Settings</span>
            <h1 className="text-display text-[clamp(2rem,4vw,3rem)] mt-2 leading-tight">Editorial copy &amp; pricing</h1>
            <p className="mt-3 text-[0.9rem] text-[var(--color-charcoal-500)] max-w-2xl">
              Tier pricing and the editorial copy the customer sees on the
              storefront. Edit inline, Save persists, Revert returns the
              field to its source default.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin" className="text-eyebrow inline-flex items-center gap-2 border border-black/15 px-4 py-2.5 hover:border-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-700)] transition-colors">
              Customizer options
            </Link>
            <Link href="/admin/garments" className="text-eyebrow inline-flex items-center gap-2 border border-black/15 px-4 py-2.5 hover:border-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-700)] transition-colors">
              Garments
            </Link>
            <Link href="/admin/media" className="text-eyebrow inline-flex items-center gap-2 border border-black/15 px-4 py-2.5 hover:border-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-700)] transition-colors">
              Media
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
        Object.entries(grouped).map(([group, defs]) => (
          <section key={group} className="mb-10">
            <h2 className="text-display text-[1.4rem] mb-4 text-[var(--color-charcoal-900)]">{group}</h2>
            <ul className="border-y border-black/10 divide-y divide-black/10">
              {defs.map((def) => {
                const current = overrides[def.key] ?? def.defaultValue;
                const draftVal = draft[def.key] ?? current;
                const isCustom = overrides[def.key] !== undefined;
                const isDirty = draftVal !== current;
                return (
                  <li key={def.key} className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-5 items-center py-4">
                    <div className="md:col-span-4">
                      <p className="text-display text-[1rem] text-[var(--color-charcoal-900)]">{def.label}</p>
                      {def.description && (
                        <p className="text-[0.78rem] text-[var(--color-charcoal-500)] mt-1 leading-relaxed">{def.description}</p>
                      )}
                      <p className="text-[0.7rem] text-[var(--color-charcoal-400)] mt-1 tabular-nums">{def.key}</p>
                    </div>
                    <div className="md:col-span-5">
                      {def.kind === "multiline" ? (
                        <textarea
                          value={draftVal}
                          onChange={(e) => setDraft((d) => ({ ...d, [def.key]: e.target.value }))}
                          placeholder={def.defaultValue}
                          rows={Math.min(8, Math.max(3, draftVal.split("\n").length + 1))}
                          className="w-full px-3 py-2.5 border border-black/15 bg-[var(--color-ivory-100)] focus:outline-none focus:border-[var(--color-burgundy-700)] text-[0.9rem] font-mono resize-y"
                        />
                      ) : (
                        <input
                          type="text"
                          value={draftVal}
                          onChange={(e) => setDraft((d) => ({ ...d, [def.key]: e.target.value }))}
                          placeholder={def.defaultValue}
                          className="w-full px-3 py-2.5 border border-black/15 bg-[var(--color-ivory-100)] focus:outline-none focus:border-[var(--color-burgundy-700)] text-[0.9rem]"
                        />
                      )}
                      <p className="text-[0.68rem] text-[var(--color-charcoal-400)] mt-1">
                        {def.kind === "multiline" ? "One bullet per line" : `Default · ${def.defaultValue || "not set (storefront shows 'Price not available')"}`}
                      </p>
                    </div>
                    <div className="md:col-span-3 flex items-center justify-end gap-2">
                      {isCustom && (
                        <span className="inline-flex items-center gap-1.5 text-eyebrow text-[var(--color-burgundy-700)]">
                          <Check size={11} strokeWidth={1.8} /> Custom
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => save(def)}
                        disabled={!isDirty}
                        className="text-eyebrow inline-flex items-center gap-2 bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] px-4 py-2 hover:bg-[var(--color-burgundy-800)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        Save
                      </button>
                      {isCustom && (
                        <button
                          type="button"
                          onClick={() => revert(def)}
                          aria-label="Revert to default"
                          className="text-eyebrow inline-flex items-center gap-1.5 border border-black/15 p-2 hover:border-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-700)] transition-colors"
                        >
                          <RotateCcw size={13} strokeWidth={1.5} />
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
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
