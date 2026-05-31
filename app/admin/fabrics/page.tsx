"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Layers, Search } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { isAdmin } from "@/lib/admin";
import { supabase } from "@/lib/supabase";

type Fabric = {
  sku: string;
  name: string;
  brand: string;
  composition: string;
  pattern: string;
  color: string;
  weight: string;
  origin: string;
  price: string;
  priceNum: number;
  image: string;
};

export default function AdminFabricsPage() {
  const { user, loading } = useAuth();
  const [admin, setAdmin] = useState<boolean | null>(null);

  const [fabrics, setFabrics]     = useState<Fabric[]>([]);
  const [disabled, setDisabled]   = useState<Set<string>>(new Set());
  const [q, setQ]                 = useState("");
  const [filter, setFilter]       = useState<"all" | "enabled" | "disabled">("all");
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setAdmin(false); return; }
    isAdmin(user.email).then(setAdmin);
  }, [user]);

  useEffect(() => {
    if (!admin) return;
    let cancelled = false;
    async function load() {
      setLoadingData(true);
      setError(null);
      try {
        const [r, ovr] = await Promise.all([
          // includeDisabled=1 returns ALL fabrics so admin can see + re-enable
          fetch("/api/fabrics?category=suit&includeDisabled=1").then((x) => x.json()),
          supabase.from("mtm_fabric_overrides").select("sku, active").eq("active", false),
        ]);
        if (cancelled) return;
        setFabrics((r.fabrics ?? []) as Fabric[]);
        const off = new Set<string>((ovr.data ?? []).map((d: { sku: string }) => String(d.sku)));
        setDisabled(off);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't load fabrics.");
      } finally {
        setLoadingData(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [admin]);

  async function toggle(sku: string, currentlyDisabled: boolean) {
    setError(null);
    const next = new Set(disabled);
    if (currentlyDisabled) {
      // Currently disabled → enable (delete override or update to active=true)
      next.delete(sku);
      const { error } = await supabase.from("mtm_fabric_overrides").upsert(
        { sku, active: true, updated_at: new Date().toISOString() },
        { onConflict: "sku" },
      );
      if (error) { setError(error.message); return; }
    } else {
      next.add(sku);
      const { error } = await supabase.from("mtm_fabric_overrides").upsert(
        { sku, active: false, updated_at: new Date().toISOString() },
        { onConflict: "sku" },
      );
      if (error) { setError(error.message); return; }
    }
    setDisabled(next);
  }

  if (loading || admin === null) return <Shell><p className="text-eyebrow text-[var(--color-charcoal-500)]">Loading…</p></Shell>;
  if (!user)  return <Shell><p>Sign in required.</p></Shell>;
  if (!admin) return <Shell><p>Not authorised.</p></Shell>;

  const visible = fabrics
    .filter((f) => {
      if (filter === "enabled")  return !disabled.has(f.sku);
      if (filter === "disabled") return disabled.has(f.sku);
      return true;
    })
    .filter((f) => {
      if (!q.trim()) return true;
      const needle = q.toLowerCase();
      return (
        f.name.toLowerCase().includes(needle) ||
        f.brand.toLowerCase().includes(needle) ||
        f.sku.toLowerCase().includes(needle) ||
        f.composition.toLowerCase().includes(needle)
      );
    });

  return (
    <Shell>
      <header className="mb-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-eyebrow text-[var(--color-burgundy-700)]">Admin · Fabrics</span>
            <h1 className="text-display text-[clamp(2rem,4vw,3rem)] mt-2 leading-tight">Fabric visibility</h1>
            <p className="mt-3 text-[0.9rem] text-[var(--color-charcoal-500)] max-w-2xl">
              Fabrics come from the ERP. Toggle any one off to hide it from the storefront without removing it from
              the ERP. Disabled fabrics still show below for review.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin" className="text-eyebrow inline-flex items-center gap-2 border border-black/15 px-4 py-2.5 hover:border-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-700)] transition-colors">
              Customizer options
            </Link>
            <Link href="/admin/orders" className="text-eyebrow inline-flex items-center gap-2 border border-black/15 px-4 py-2.5 hover:border-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-700)] transition-colors">
              Orders
            </Link>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Total fabrics" value={fabrics.length.toString()} icon={<Layers size={14} strokeWidth={1.5} />} />
          <Stat label="Enabled" value={(fabrics.length - disabled.size).toString()} />
          <Stat label="Disabled" value={disabled.size.toString()} />
          <Stat label="Source" value="Live ERP" />
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search size={14} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-charcoal-500)]" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search SKU / brand / fabric name / composition"
            className="w-full pl-9 pr-3 py-2.5 border border-black/15 bg-[var(--color-ivory-100)] focus:outline-none focus:border-[var(--color-burgundy-700)] text-[0.9rem]"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as "all" | "enabled" | "disabled")}
          className="border border-black/15 bg-[var(--color-ivory-100)] px-3 py-2.5 text-[0.9rem] focus:outline-none focus:border-[var(--color-burgundy-700)]"
        >
          <option value="all">All ({fabrics.length})</option>
          <option value="enabled">Enabled ({fabrics.length - disabled.size})</option>
          <option value="disabled">Disabled ({disabled.size})</option>
        </select>
      </div>

      {error && (
        <p className="mb-4 text-[0.85rem] text-[var(--color-burgundy-700)] bg-[var(--color-burgundy-50)] border border-[var(--color-burgundy-700)]/20 px-3 py-2">
          {error}
        </p>
      )}

      {loadingData ? (
        <p className="text-eyebrow text-[var(--color-charcoal-500)]">Loading from ERP…</p>
      ) : visible.length === 0 ? (
        <p className="text-[var(--color-charcoal-700)] border border-black/10 p-8 bg-[var(--color-ivory-200)]">No fabrics match this filter.</p>
      ) : (
        <ul className="border-y border-black/10 divide-y divide-black/10">
          {visible.map((f) => {
            const off = disabled.has(f.sku);
            return (
              <li
                key={f.sku}
                className={`grid grid-cols-12 gap-3 items-center py-4 px-2 ${off ? "opacity-60" : ""}`}
              >
                <div className="col-span-12 sm:col-span-1 relative w-16 h-16 bg-[var(--color-ivory-200)] overflow-hidden">
                  {f.image && (
                    <Image src={f.image} alt={f.name} fill sizes="64px" className="object-cover" />
                  )}
                </div>
                <div className="col-span-6 sm:col-span-3">
                  <span className="text-eyebrow text-[var(--color-charcoal-500)]">{f.brand}</span>
                  <p className="text-display text-[1rem] mt-0.5 leading-tight">{f.name}</p>
                  <p className="text-[0.7rem] text-[var(--color-charcoal-500)] mt-1 tabular-nums">SKU {f.sku}</p>
                </div>
                <div className="col-span-6 sm:col-span-3 text-[0.82rem] text-[var(--color-charcoal-700)]">
                  {f.composition}<br />
                  <span className="text-[var(--color-charcoal-500)]">{[f.pattern, f.color, f.origin].filter(Boolean).join(" · ")}</span>
                </div>
                <div className="col-span-6 sm:col-span-2 text-[0.9rem] tabular-nums">{f.price}</div>
                <div className="col-span-6 sm:col-span-3 flex items-center justify-end gap-3">
                  <span className={`text-[0.7rem] uppercase tracking-[0.15em] ${off ? "text-[var(--color-charcoal-500)]" : "text-[var(--color-burgundy-700)]"}`}>
                    {off ? "Hidden from site" : "Live on site"}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggle(f.sku, off)}
                    aria-label={off ? "Enable fabric" : "Disable fabric"}
                    className={`relative inline-flex h-6 w-11 items-center transition-colors ${
                      off ? "bg-[var(--color-charcoal-500)]/30" : "bg-[var(--color-burgundy-700)]"
                    }`}
                  >
                    <span className={`inline-block h-5 w-5 bg-[var(--color-ivory-100)] transform transition-transform ${off ? "translate-x-0.5" : "translate-x-[22px]"}`} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
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

function Stat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="border border-black/10 p-4 bg-[var(--color-ivory-100)]">
      <p className="text-eyebrow text-[var(--color-charcoal-500)] inline-flex items-center gap-2">{icon}{label}</p>
      <p className="text-display text-[1.5rem] mt-2 leading-none text-[var(--color-burgundy-700)] tabular-nums">{value}</p>
    </div>
  );
}
