"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Database, RefreshCw, AlertTriangle, Lock, Pencil, Trash2, Plus, Check, X, Upload, Package, Eye, EyeOff, Shirt, Image as ImageIcon, Users, Tag, Truck, ChevronUp, ChevronDown, Boxes, ShieldCheck, GraduationCap } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { isAdmin } from "@/lib/admin";
import {
  fetchSteps, fetchOptions, seedFromConfig,
  updateOption, insertOption, deleteOption, uploadOptionImage,
  updateStep, insertStep, deleteStep, fetchStepOrders, saveStepOrder, applyStepOrder,
  type DbStep, type DbOption,
} from "@/lib/adminData";
import { fetchGarments, toSlug, type Garment } from "@/lib/garments";
import { alphaKeyToPng } from "@/lib/imageKey";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-32 md:pt-40 pb-24 min-h-[80vh]">
      <div className="container-editorial">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-eyebrow text-[var(--color-charcoal-500)] hover:text-[var(--color-burgundy-700)] transition-colors mb-8"
        >
          <ArrowLeft size={14} strokeWidth={1.5} /> The House
        </Link>
        {children}
      </div>
    </div>
  );
}

type CategoryFilter = string; // "all" | any garment slug

export default function AdminPage() {
  const { user, loading } = useAuth();
  const [admin, setAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) { setAdmin(false); return; }
    isAdmin(user.email).then(setAdmin);
  }, [user]);

  const [steps, setSteps] = useState<DbStep[] | null>(null);
  const [options, setOptions] = useState<DbOption[]>([]);
  const [garments, setGarments] = useState<Garment[]>([]);
  // Per-garment step order (settings key step.order.<garment>).
  const [stepOrders, setStepOrders] = useState<Record<string, string[]>>({});
  // Which step cards are expanded (their options dropped down). Collapsed
  // by default so the list reads as a compact set of step titles; the
  // atelier opens a step to see/edit its options. Expand all / Collapse
  // all toggle every visible card at once.
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  // Slug of the step awaiting a delete confirmation (inline, no blocking dialog).
  const [confirmDelStep, setConfirmDelStep] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [filter, setFilter] = useState<CategoryFilter>("all");

  const load = useCallback(async () => {
    setLoadingData(true);
    setError(null);
    try {
      const [s, o, g, ord] = await Promise.all([fetchSteps(), fetchOptions(), fetchGarments(), fetchStepOrders()]);
      setSteps(s);
      setOptions(o);
      setGarments(g);
      setStepOrders(ord);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load configuration.");
      setSteps(null);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (admin) load();
  }, [admin, load]);

  const handleSeed = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      await seedFromConfig();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Seed failed. Did you run the schema and add yourself to mtm_admins?");
    } finally {
      setBusy(false);
    }
  }, [load]);

  // Auto-seed the first time an admin opens an empty (but reachable) config.
  const autoSeeded = useRef(false);
  useEffect(() => {
    if (admin && !loadingData && !busy && !error && steps !== null && steps.length === 0 && !autoSeeded.current) {
      autoSeeded.current = true;
      handleSeed();
    }
  }, [admin, loadingData, busy, error, steps, handleSeed]);

  const optionsByStep = useMemo(() => {
    const map: Record<string, DbOption[]> = {};
    for (const o of options) (map[o.step_slug] ??= []).push(o);
    return map;
  }, [options]);

  if (loading || admin === null) return <Shell><p className="text-eyebrow text-[var(--color-charcoal-500)]">Loading…</p></Shell>;

  if (!user) {
    return (
      <Shell>
        <h1 className="text-display text-[clamp(2rem,4vw,3rem)]">Atelier Admin</h1>
        <p className="mt-4 text-[0.95rem] text-[var(--color-charcoal-700)]">
          Please <Link href="/account" className="text-[var(--color-burgundy-700)] underline">sign in</Link> with an admin account.
        </p>
      </Shell>
    );
  }

  if (!admin) {
    return (
      <Shell>
        <div className="max-w-md">
          <Lock size={22} strokeWidth={1.4} className="text-[var(--color-burgundy-700)]" />
          <h1 className="text-display text-[clamp(2rem,4vw,3rem)] mt-4">Access restricted</h1>
          <p className="mt-4 text-[0.95rem] text-[var(--color-charcoal-700)] leading-relaxed">
            This area is reserved for the atelier. If you have an account here, please continue
            shopping or visit <Link href="/account" className="text-[var(--color-burgundy-700)] underline">your account</Link> instead.
          </p>
        </div>
      </Shell>
    );
  }

  // Every step is shown and live. Visibility is controlled per garment
  // (the "Visible for" chips) and per option (the eye toggle on a row),
  // not by a global enable/disable pile — so there's no "disabled steps"
  // concept to manage.
  const allSteps = steps ?? [];
  const activeSteps = allSteps;
  const stepCount = activeSteps.length;
  const notConfigured = !error && allSteps.length === 0 && !loadingData && !busy;

  const visible = activeSteps.filter((s) => filter === "all" || s.applies_to.includes(filter));
  // When a single garment is selected, present its steps in the atelier's
  // saved order ("what comes after what" in the customer flow). All-steps
  // view keeps the global sort_order masonry.
  const orderedVisible = filter === "all" ? visible : applyStepOrder(visible, stepOrders[filter]);

  const toggleExpand = (slug: string) => setExpanded((prev) => {
    const next = new Set(prev);
    if (next.has(slug)) next.delete(slug); else next.add(slug);
    return next;
  });
  const expandAll = () => setExpanded(new Set(orderedVisible.map((s) => s.slug)));
  const collapseAll = () => setExpanded(new Set());

  async function moveStep(slug: string, dir: -1 | 1) {
    if (filter === "all" || busy) return;
    const order = orderedVisible.map((s) => s.slug);
    const idx = order.indexOf(slug);
    const j = idx + dir;
    if (idx < 0 || j < 0 || j >= order.length) return;
    [order[idx], order[j]] = [order[j], order[idx]];
    setBusy(true);
    try { await saveStepOrder(filter, order); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Couldn't save the order."); }
    finally { setBusy(false); }
  }
  // Counts are derived per-garment from whatever atelier has configured
  // in /admin/garments, so adding "Overcoat" there reflects here without
  // a code change.
  // Sidebar shows only Live garments (Hidden ones disappear from /admin
  // the way they disappear from the Design Yours picker), so toggling a
  // garment off in /admin/garments truly takes it offline everywhere.
  const filterTabs: { key: CategoryFilter; label: string; count: number }[] = [
    { key: "all", label: "All steps", count: stepCount },
    ...garments.filter((g) => g.active).map((g) => ({
      key: g.slug,
      label: g.label,
      count: activeSteps.filter((s) => s.applies_to.includes(g.slug)).length,
    })),
  ];

  return (
    <Shell>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 border-b border-black/10 pb-8">
        <div>
          <h1 className="text-display text-[clamp(2.25rem,4.5vw,3.5rem)] leading-[1.02]">Customization options</h1>
          <p className="mt-3 text-[0.9rem] text-[var(--color-charcoal-500)]">
            {stepCount > 0 ? `${stepCount} steps · ${options.length} options` : "Manage the options shown in the customizer."}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href="/admin/orders"
            className="text-eyebrow inline-flex items-center gap-2 bg-[var(--color-charcoal-900)] text-[var(--color-ivory-100)] px-5 py-3 hover:bg-[var(--color-burgundy-700)] transition-colors"
          >
            <Package size={14} strokeWidth={1.5} /> Orders & customers
          </Link>
          <Link
            href="/admin/users"
            className="text-eyebrow inline-flex items-center gap-2 border border-[var(--color-charcoal-900)] text-[var(--color-charcoal-900)] px-5 py-3 hover:border-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-700)] transition-colors"
          >
            <Users size={14} strokeWidth={1.5} /> Users
          </Link>
          <Link
            href="/admin/employees"
            className="text-eyebrow inline-flex items-center gap-2 border border-[var(--color-charcoal-900)] text-[var(--color-charcoal-900)] px-5 py-3 hover:border-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-700)] transition-colors"
          >
            <ShieldCheck size={14} strokeWidth={1.5} /> Team access
          </Link>
          <Link
            href="/learn"
            className="text-eyebrow inline-flex items-center gap-2 border border-[var(--color-charcoal-900)] text-[var(--color-charcoal-900)] px-5 py-3 hover:border-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-700)] transition-colors"
          >
            <GraduationCap size={14} strokeWidth={1.5} /> Training
          </Link>
          <Link
            href="/admin/garments"
            className="text-eyebrow inline-flex items-center gap-2 border border-[var(--color-charcoal-900)] text-[var(--color-charcoal-900)] px-5 py-3 hover:border-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-700)] transition-colors"
          >
            <Shirt size={14} strokeWidth={1.5} /> Garments
          </Link>
          <Link
            href="/admin/erp"
            className="text-eyebrow inline-flex items-center gap-2 border border-[var(--color-charcoal-900)] text-[var(--color-charcoal-900)] px-5 py-3 hover:border-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-700)] transition-colors"
          >
            <Boxes size={14} strokeWidth={1.5} /> ERP data
          </Link>
          <Link
            href="/admin/media"
            className="text-eyebrow inline-flex items-center gap-2 border border-[var(--color-charcoal-900)] text-[var(--color-charcoal-900)] px-5 py-3 hover:border-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-700)] transition-colors"
          >
            <ImageIcon size={14} strokeWidth={1.5} /> Media
          </Link>
          <Link
            href="/admin/discounts"
            className="text-eyebrow inline-flex items-center gap-2 border border-[var(--color-charcoal-900)] text-[var(--color-charcoal-900)] px-5 py-3 hover:border-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-700)] transition-colors"
          >
            <Tag size={14} strokeWidth={1.5} /> Discounts
          </Link>
          <Link
            href="/admin/shipping"
            className="text-eyebrow inline-flex items-center gap-2 border border-[var(--color-charcoal-900)] text-[var(--color-charcoal-900)] px-5 py-3 hover:border-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-700)] transition-colors"
          >
            <Truck size={14} strokeWidth={1.5} /> Shipping
          </Link>
          <Link
            href="/admin/settings"
            className="text-eyebrow inline-flex items-center gap-2 border border-[var(--color-charcoal-900)] text-[var(--color-charcoal-900)] px-5 py-3 hover:border-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-700)] transition-colors"
          >
            <Database size={14} strokeWidth={1.5} /> Settings
          </Link>
          <button
            type="button"
            onClick={load}
            disabled={loadingData || busy}
            className="text-eyebrow inline-flex items-center gap-2 border border-[var(--color-charcoal-900)]/25 px-4 py-3 hover:border-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-700)] transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} strokeWidth={1.5} /> Refresh
          </button>
          <button
            type="button"
            onClick={handleSeed}
            disabled={busy}
            className="text-eyebrow inline-flex items-center gap-2 bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] px-5 py-3 hover:bg-[var(--color-burgundy-800)] transition-colors disabled:opacity-60"
          >
            <Database size={14} strokeWidth={1.5} /> {busy ? "Seeding…" : "Seed from current config"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-8 border border-[var(--color-burgundy-700)]/25 bg-[var(--color-burgundy-50)] p-6">
          <div className="flex items-center gap-2 text-[var(--color-burgundy-700)] text-eyebrow">
            <AlertTriangle size={15} strokeWidth={1.5} /> Couldn&rsquo;t reach the config tables
          </div>
          <p className="mt-3 text-[0.88rem] text-[var(--color-charcoal-800)] leading-relaxed">{error}</p>
          <p className="mt-3 text-[0.88rem] text-[var(--color-charcoal-700)] leading-relaxed">
            Run <code className="text-[0.82rem]">supabase/schema.sql</code> in the Supabase SQL editor, then add your
            email to the <code className="text-[0.82rem]">mtm_admins</code> table, and try again.
          </p>
        </div>
      )}

      {notConfigured && (
        <div className="mt-10 text-center border border-dashed border-black/15 py-16 px-6">
          <Database size={26} strokeWidth={1.3} className="text-[var(--color-burgundy-700)] mx-auto" />
          <h2 className="text-display text-[1.6rem] mt-4">No options in the database yet</h2>
          <p className="mt-2 text-[0.9rem] text-[var(--color-charcoal-600)] max-w-md mx-auto leading-relaxed">
            Click <strong>Seed from current config</strong> above to import the existing customizer options into Supabase.
          </p>
        </div>
      )}

      {!error && stepCount > 0 && (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[210px_1fr] gap-8 lg:gap-12 items-start">
          {/* Sidebar — filters */}
          <aside className="lg:sticky lg:top-32">
            <div className="text-eyebrow text-[var(--color-charcoal-500)] mb-3">Garment</div>
            <nav className="flex lg:flex-col gap-1.5 flex-wrap">
              {filterTabs.map(({ key, label, count }) => {
                const active = filter === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFilter(key)}
                    className={`text-eyebrow inline-flex items-center justify-between gap-3 px-4 py-3 transition-colors ${
                      active
                        ? "bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)]"
                        : "text-[var(--color-charcoal-700)] hover:bg-[var(--color-ivory-200)]"
                    }`}
                  >
                    <span>{label}</span>
                    <span className={active ? "text-[var(--color-ivory-100)]/70" : "text-[var(--color-charcoal-400)]"}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </nav>
            <div className="mt-4 hidden lg:block">
              <Link
                href="/admin/garments"
                className="text-eyebrow inline-flex items-center gap-2 text-[var(--color-burgundy-700)] hover:underline"
              >
                <Plus size={12} strokeWidth={1.5} /> Manage garments
              </Link>
            </div>
            <p className="mt-6 text-[0.75rem] text-[var(--color-charcoal-400)] leading-relaxed hidden lg:block">
              Hover a row to edit or delete. Pricing is set per tier in Settings, not per option.
            </p>
          </aside>

          {/* Main — masonry for "all steps"; a single ordered column per
              garment so the atelier can see and set the customer sequence. */}
          <div>
          {/* Expand / Collapse all — top-right, so the long option lists
              stay tucked away until the atelier opens a step. */}
          <div className="flex items-center justify-end gap-3 mb-5">
            <span className="text-eyebrow text-[0.62rem] text-[var(--color-charcoal-400)] mr-auto tabular-nums">
              {expanded.size}/{orderedVisible.length} open
            </span>
            <button
              type="button"
              onClick={expandAll}
              className="text-eyebrow inline-flex items-center gap-1.5 border border-black/15 px-3 py-1.5 hover:border-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-700)] transition-colors"
            >
              <ChevronDown size={13} strokeWidth={2} /> Expand all
            </button>
            <button
              type="button"
              onClick={collapseAll}
              className="text-eyebrow inline-flex items-center gap-1.5 border border-black/15 px-3 py-1.5 hover:border-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-700)] transition-colors"
            >
              <ChevronUp size={13} strokeWidth={2} /> Collapse all
            </button>
          </div>
          <div className="mb-5">
            <AddStep
              garments={garments.filter((g) => g.active)}
              defaultGarments={filter === "all" ? [] : [filter]}
              nextSortOrder={Math.max(0, ...allSteps.map((s) => s.sort_order)) + 10}
              existingSlugs={new Set(allSteps.map((s) => s.slug))}
              onAdded={async (slug) => {
                await load();
                setExpanded((p) => { const n = new Set(p); n.add(slug); return n; });
              }}
            />
          </div>
          <div className={filter === "all" ? "columns-1 xl:columns-2 gap-5 [&>*]:mb-5" : "flex flex-col gap-5"}>
            {filter !== "all" && orderedVisible.length > 1 && (
              <p className="text-[0.8rem] text-[var(--color-charcoal-600)] bg-[var(--color-ivory-200)] border border-black/10 px-4 py-2.5">
                This is the order the customer sees when designing a {filterTabs.find((t) => t.key === filter)?.label.toLowerCase() ?? filter}. Use the
                <ChevronUp size={12} strokeWidth={2} className="inline mx-0.5 -mt-0.5" /><ChevronDown size={12} strokeWidth={2} className="inline mr-0.5 -mt-0.5" />
                arrows to change what comes after what. The order applies to this garment only.
              </p>
            )}
            {filter !== "all" && visible.length === 0 && (
              <div className="break-inside-avoid border border-dashed border-black/15 bg-[var(--color-ivory-200)] p-6">
                <p className="text-display text-[1.3rem] text-[var(--color-charcoal-900)]">
                  No steps shown for {filterTabs.find((t) => t.key === filter)?.label ?? filter} yet
                </p>
                <p className="mt-2 text-[0.85rem] text-[var(--color-charcoal-600)] leading-relaxed">
                  Open <button type="button" onClick={() => setFilter("all")} className="text-[var(--color-burgundy-700)] underline">All steps</button> and
                  toggle this garment on for each step you want in its customizer. Every step has a
                  per-garment visibility row in its header.
                </p>
              </div>
            )}
            {orderedVisible.map((s, i) => {
              const isOpen = expanded.has(s.slug);
              const optCount = (optionsByStep[s.slug] ?? []).length;
              return (
              <div key={s.slug} className="break-inside-avoid border border-black/10 bg-[var(--color-ivory-100)]">
                {/* Summary row — always visible. Click the title to drop the options down. */}
                <div className="flex items-center gap-2 px-4 py-3">
                  {filter !== "all" && (
                    <span className="inline-flex items-center gap-1 mr-1 shrink-0">
                      <span className="text-display text-[1.05rem] tabular-nums text-[var(--color-burgundy-700)] w-5 text-center">{i + 1}</span>
                      <span className="inline-flex flex-col">
                        <button
                          type="button"
                          onClick={() => moveStep(s.slug, -1)}
                          disabled={i === 0 || busy}
                          aria-label="Move earlier"
                          title="Move earlier in the flow"
                          className="text-[var(--color-charcoal-500)] hover:text-[var(--color-burgundy-700)] disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronUp size={14} strokeWidth={2} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveStep(s.slug, 1)}
                          disabled={i === orderedVisible.length - 1 || busy}
                          aria-label="Move later"
                          title="Move later in the flow"
                          className="text-[var(--color-charcoal-500)] hover:text-[var(--color-burgundy-700)] disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronDown size={14} strokeWidth={2} />
                        </button>
                      </span>
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleExpand(s.slug)}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left"
                  >
                    <ChevronDown
                      size={16}
                      strokeWidth={2}
                      className={`shrink-0 text-[var(--color-charcoal-400)] transition-transform ${isOpen ? "" : "-rotate-90"}`}
                    />
                    <span className="text-display text-[1.2rem] text-[var(--color-charcoal-900)] truncate">{s.title}</span>
                    <Badge>{s.kind}</Badge>
                    <span className="text-[0.72rem] text-[var(--color-charcoal-400)] shrink-0 ml-auto whitespace-nowrap">
                      {optCount} option{optCount === 1 ? "" : "s"}
                    </span>
                  </button>
                  {/* Delete the whole module — available right in the header,
                      so it can be removed without expanding it. */}
                  {confirmDelStep === s.slug ? (
                    <span className="inline-flex items-center gap-2 shrink-0 pl-1">
                      <span className="text-[0.7rem] text-[var(--color-charcoal-600)] hidden sm:inline">Delete this module?</span>
                      <button
                        type="button"
                        onClick={async () => {
                          setBusy(true);
                          try { await deleteStep(s.slug); setConfirmDelStep(null); await load(); }
                          catch (e) { setError(e instanceof Error ? e.message : "Couldn't delete the module."); }
                          finally { setBusy(false); }
                        }}
                        disabled={busy}
                        className="text-[0.7rem] tracking-wide uppercase text-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-800)]"
                      >
                        Delete
                      </button>
                      <button type="button" onClick={() => setConfirmDelStep(null)} className="text-[0.7rem] tracking-wide uppercase text-[var(--color-charcoal-400)]">Cancel</button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDelStep(s.slug)}
                      aria-label="Delete module"
                      title="Delete this module"
                      className="shrink-0 p-1.5 text-[var(--color-charcoal-400)] hover:text-[var(--color-burgundy-700)] transition-colors"
                    >
                      <Trash2 size={15} strokeWidth={1.5} />
                    </button>
                  )}
                </div>

                {isOpen && (
                  <>
                    {/* Tier, per-garment visibility, hints */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-5 pb-4 border-b border-black/10">
                      <TierPicker slug={s.slug} tier={s.tier} onChanged={load} />
                      <AppliesToEditor
                        slug={s.slug}
                        appliesTo={s.applies_to}
                        garments={garments}
                        onChanged={load}
                      />
                      {s.requires_slug && (
                        <span className="basis-full text-[0.7rem] text-[var(--color-charcoal-400)]">
                          shows if {s.requires_slug}={s.requires_value}
                        </span>
                      )}
                      {s.kind === "diagram" && (
                        <span className="basis-full text-[0.75rem] font-medium text-[var(--color-burgundy-700)]">
                          Diagram size · 800 × 1000 px · 4:5 portrait · PNG with transparent background
                        </span>
                      )}
                    </div>
                    <div className="divide-y divide-black/5">
                      {(optionsByStep[s.slug] ?? []).map((o) => (
                        <OptionRow key={o.id} option={o} stepSlug={s.slug} stepKind={s.kind} onChanged={load} />
                      ))}
                      {optCount === 0 && (
                        <div className="px-5 py-3 text-[0.8rem] text-[var(--color-charcoal-400)] italic">No options yet</div>
                      )}
                      <AddOption stepSlug={s.slug} stepKind={s.kind} existingValues={(optionsByStep[s.slug] ?? []).map((o) => o.value)} onAdded={load} />
                    </div>
                  </>
                )}
              </div>
              );
            })}
          </div>
          </div>
        </div>
      )}
    </Shell>
  );
}

/* ── Tier list helpers ──
   A module can belong to ONE OR MORE packages. We keep storing it in the
   existing `tier` text column as a comma-separated list ("essential,signature")
   so no DB migration is needed; a legacy single value parses as a one-item set. */
const TIER_KEYS = ["essential", "signature", "bespoke"] as const;
// Selected tier chips use the same solid burgundy as the "Visible for"
// garment chips, so a picked package reads as the brand red, not grey/black.
const TIER_SELECTED = "bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)]";
const TIER_TONES: Record<string, string> = {
  essential: TIER_SELECTED,
  signature: TIER_SELECTED,
  bespoke:   TIER_SELECTED,
};
function parseTiers(tier: string | null | undefined): Set<string> {
  return new Set((tier ?? "").split(",").map((t) => t.trim()).filter(Boolean));
}
function serializeTiers(set: Set<string>): string {
  return TIER_KEYS.filter((t) => set.has(t)).join(",");
}

/* ── Tier picker (which packages this step belongs to — multi-select) ── */
function TierPicker({
  slug, tier, onChanged,
}: {
  slug: string;
  tier: string | null;
  onChanged: () => Promise<void> | void;
}) {
  const [busy, setBusy] = useState(false);
  const selected = parseTiers(tier);
  async function toggle(t: string) {
    if (busy) return;
    const next = new Set(selected);
    if (next.has(t)) next.delete(t); else next.add(t);
    setBusy(true);
    try { await updateStep(slug, { tier: serializeTiers(next) }); await onChanged(); }
    finally { setBusy(false); }
  }
  return (
    <span className="inline-flex border border-black/10 overflow-hidden">
      {TIER_KEYS.map((t) => {
        const active = selected.has(t);
        return (
          <button
            key={t}
            type="button"
            onClick={() => toggle(t)}
            disabled={busy}
            aria-pressed={active}
            className={`text-eyebrow text-[0.6rem] px-2.5 py-1 transition-colors ${
              active ? TIER_TONES[t] : "text-[var(--color-charcoal-500)] hover:bg-[var(--color-ivory-200)]"
            } ${busy ? "opacity-50" : ""}`}
          >
            {t}
          </button>
        );
      })}
    </span>
  );
}

/* ── Applies-to editor (which garments show this step in their customizer) ──
   This is the per-garment visible/hidden control. A step only appears in a
   garment's flow when its slug is in applies_to. Toggling a chip on adds the
   slug; toggling off removes it. That's how the atelier turns chinos /
   overcoat / tuxedo into real customizers without a code change. */
function AppliesToEditor({
  slug, appliesTo, garments, onChanged,
}: {
  slug: string;
  appliesTo: string[];
  garments: Garment[];
  onChanged: () => Promise<void> | void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const live = garments.filter((g) => g.active);

  async function toggle(garmentSlug: string) {
    if (busy) return;
    const on = appliesTo.includes(garmentSlug);
    const next = on
      ? appliesTo.filter((x) => x !== garmentSlug)
      : [...appliesTo, garmentSlug];
    setBusy(garmentSlug);
    try { await updateStep(slug, { applies_to: next }); await onChanged(); }
    finally { setBusy(null); }
  }

  return (
    <div className="basis-full">
      <span className="text-eyebrow text-[0.58rem] text-[var(--color-charcoal-400)]">Visible for</span>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {live.map((g) => {
          const on = appliesTo.includes(g.slug);
          return (
            <button
              key={g.slug}
              type="button"
              onClick={() => toggle(g.slug)}
              disabled={busy !== null}
              title={on ? `Hide this step from ${g.label}` : `Show this step in ${g.label}`}
              className={`text-eyebrow text-[0.6rem] inline-flex items-center gap-1 px-2.5 py-1 border transition-colors ${
                on
                  ? "bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] border-[var(--color-burgundy-700)]"
                  : "text-[var(--color-charcoal-500)] border-black/15 hover:border-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-700)]"
              } ${busy === g.slug ? "opacity-50" : ""}`}
            >
              {on ? <Eye size={11} strokeWidth={1.5} /> : <EyeOff size={11} strokeWidth={1.5} />}
              {g.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Create a new step / module ──────────────────────────────────────
   Lets the atelier add a whole new customizer module (like "Suspend your
   style" or "To belt or not"), not just options inside an existing one.
   They name it, pick the kind + tier + which garments it shows for; the
   options are added afterward with the per-step "Add option". */
function AddStep({
  garments, defaultGarments, nextSortOrder, existingSlugs, onAdded,
}: {
  garments: Garment[];
  defaultGarments: string[];
  nextSortOrder: number;
  existingSlugs: Set<string>;
  onAdded: (slug: string) => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  // New modules are "choice" kind: each option shows as a labelled tile,
  // and uploading an image per option promotes it to an image tile. So the
  // atelier never has to think about diagram/swatch/gallery.
  const kind = "choice";
  const [tiers, setTiers] = useState<string[]>(["essential"]);
  const [appliesTo, setAppliesTo] = useState<string[]>(defaultGarments);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function toggleG(slug: string) {
    setAppliesTo((a) => (a.includes(slug) ? a.filter((x) => x !== slug) : [...a, slug]));
  }
  function toggleTier(t: string) {
    setTiers((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));
  }

  async function add() {
    if (!title.trim()) { setErr("Give the module a name."); return; }
    // Garments are optional — a module can be created with none picked and
    // toggled on later via the per-step "Visible for" chips.
    let slug = toSlug(title) || "module";
    if (existingSlugs.has(slug)) {
      let n = 2;
      while (existingSlugs.has(`${slug}-${n}`)) n++;
      slug = `${slug}-${n}`;
    }
    setBusy(true); setErr(null);
    try {
      await insertStep({ slug, title: title.trim(), kind, tier: TIER_KEYS.filter((t) => tiers.includes(t)).join(","), applies_to: appliesTo, sort_order: nextSortOrder });
      setTitle(""); setTiers(["essential"]); setAppliesTo(defaultGarments); setOpen(false);
      await onAdded(slug);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't create the module.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => { setAppliesTo(defaultGarments); setOpen(true); }}
        className="w-full text-eyebrow inline-flex items-center justify-center gap-2 border border-dashed border-[var(--color-burgundy-700)]/40 text-[var(--color-burgundy-700)] px-4 py-3 hover:bg-[var(--color-burgundy-50)] transition-colors"
      >
        <Plus size={14} strokeWidth={1.5} /> Add a new module
      </button>
    );
  }
  return (
    <div className="border border-[var(--color-burgundy-700)]/30 bg-[var(--color-ivory-200)] p-5">
      <p className="text-eyebrow text-[var(--color-charcoal-500)] mb-4 inline-flex items-center gap-2">
        <Plus size={14} strokeWidth={1.5} /> New module
      </p>
      <div className="flex flex-wrap items-end gap-4">
        <Field label="Module name">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Suspend your style" className={inputCls + " w-64"} />
        </Field>
        <Field label="Tiers (one or more)">
          <span className="inline-flex border border-black/10 overflow-hidden">
            {TIER_KEYS.map((t) => {
              const active = tiers.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTier(t)}
                  aria-pressed={active}
                  className={`text-eyebrow text-[0.6rem] px-2.5 py-2 transition-colors ${
                    active ? TIER_TONES[t] : "text-[var(--color-charcoal-500)] hover:bg-[var(--color-ivory-200)]"
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </span>
        </Field>
      </div>
      <div className="mt-4">
        <span className="text-eyebrow text-[0.6rem] text-[var(--color-charcoal-500)]">
          Visible for
          <span className="ml-2 normal-case tracking-normal text-[var(--color-charcoal-400)]">optional — toggle later from the step too</span>
        </span>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {garments.map((g) => {
            const on = appliesTo.includes(g.slug);
            return (
              <button
                key={g.slug}
                type="button"
                onClick={() => toggleG(g.slug)}
                className={`text-eyebrow text-[0.6rem] inline-flex items-center gap-1 px-2.5 py-1 border transition-colors ${
                  on
                    ? "bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] border-[var(--color-burgundy-700)]"
                    : "text-[var(--color-charcoal-500)] border-black/15 hover:border-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-700)]"
                }`}
              >
                {on ? <Eye size={11} strokeWidth={1.5} /> : <EyeOff size={11} strokeWidth={1.5} />}
                {g.label}
              </button>
            );
          })}
        </div>
      </div>
      {title.trim() && (
        <p className="text-[0.72rem] text-[var(--color-charcoal-500)] mt-2">slug → <code className="text-[0.76rem]">{toSlug(title) || "module"}</code></p>
      )}
      {err && <p className="text-[0.8rem] text-[var(--color-burgundy-700)] mt-2">{err}</p>}
      <div className="flex gap-2 pt-4">
        <button onClick={add} disabled={busy} className="text-eyebrow inline-flex items-center gap-2 bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] px-4 py-2.5 hover:bg-[var(--color-burgundy-800)] disabled:opacity-60">
          <Plus size={13} strokeWidth={1.5} /> {busy ? "Creating…" : "Create module"}
        </button>
        <button onClick={() => { setOpen(false); setErr(null); }} className="text-eyebrow inline-flex items-center gap-2 border border-black/20 px-4 py-2.5 hover:border-[var(--color-burgundy-700)]">Cancel</button>
      </div>
      <p className="text-[0.72rem] text-[var(--color-charcoal-500)] mt-3 leading-relaxed">
        The module starts empty. After creating it, open it and use <strong>Add option</strong> to add its choices (like &ldquo;With belt loops&rdquo; / &ldquo;Without belt loops&rdquo;).
      </p>
    </div>
  );
}

/* ── Option image preview (diagram → file PNG, swatch → colour chip, gallery → uploaded image) ── */
function OptionThumb({
  stepSlug, stepKind, value, color, image,
}: { stepSlug: string; stepKind: string; value: string; color: string | null; image: string | null }) {
  if (stepKind === "swatch") {
    return color
      ? <span className="w-8 h-8 rounded-sm border border-black/15 shrink-0" style={{ background: color }} />
      : <span className="w-8 h-8 rounded-sm border border-black/15 shrink-0 bg-[var(--color-ivory-200)]" />;
  }
  if (stepKind === "gallery") {
    return image
      ? <img src={image} alt="" className="w-8 h-8 object-cover border border-black/15 shrink-0" />
      : <span className="w-8 h-8 border border-dashed border-black/20 shrink-0 inline-flex items-center justify-center text-[0.6rem] text-[var(--color-charcoal-400)]">img</span>;
  }
  // diagram: served from /public/customizer/<stepSlug>/<value>.png
  return (
    <span className="w-8 h-8 bg-[var(--color-ivory-200)] shrink-0 inline-flex items-center justify-center">
      <img
        src={`/customizer/${stepSlug}/${value}.png`}
        alt=""
        className="w-full h-full object-contain p-0.5"
        onError={(e) => { (e.target as HTMLImageElement).style.visibility = "hidden"; }}
      />
    </span>
  );
}

/* ── Editable option row ── */
function OptionRow({
  option, stepSlug, stepKind, onChanged,
}: {
  option: DbOption;
  stepSlug: string;
  stepKind: string;
  onChanged: () => Promise<void> | void;
}) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(option.label);
  const [color, setColor] = useState(option.color ?? "");
  const [note, setNote] = useState(option.note ?? "");
  const [active, setActive] = useState(option.active);
  const [image, setImage] = useState(option.image_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  // Bundled diagram path that ships with the storefront. Each diagram step
  // has a PNG at /public/customizer/<stepSlug>/<value>.png — that's what
  // the customer sees today when image_url is null. The edit form was
  // saying "No image" because it only checked the DB field; show the
  // static fallback too so the admin doesn't think the asset is missing.
  const staticFallback = stepKind === "diagram" ? `/customizer/${stepSlug}/${option.value}.png` : "";
  const [fallbackBroken, setFallbackBroken] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      // Same client-side alpha-key + tight-crop we use on Add: any white
      // pixels become transparent so the diagram sits on the customizer's
      // ivory page without a card behind it.
      const cleaned = await alphaKeyToPng(file);
      const url = await uploadOptionImage(cleaned);
      setImage(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed. Is the 'mtm-media' bucket created and public?");
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    setBusy(true);
    try {
      await updateOption(option.id, {
        label: label.trim() || option.value,
        color: stepKind === "swatch" ? (color.trim() || null) : option.color,
        // Image is editable on every step kind — diagram, choice, gallery
        // all support an option thumbnail in the customizer row.
        image_url: image.trim() || null,
        note: note.trim() || null,
        active,
      });
      setEditing(false);
      await onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try { await deleteOption(option.id); await onChanged(); }
    finally { setBusy(false); }
  }

  if (editing) {
    return (
      <div className="px-5 py-4 bg-[var(--color-ivory-200)]/60 space-y-3">
        <div className="flex flex-wrap items-end gap-4">
          <Field label="Label"><input value={label} onChange={(e) => setLabel(e.target.value)} className={inputCls + " w-56"} /></Field>
          {stepKind === "swatch" && (
            <Field label="Colour (hex)"><input value={color} onChange={(e) => setColor(e.target.value)} placeholder="#6e2639" className={inputCls + " w-32"} /></Field>
          )}
          <label className="inline-flex items-center gap-2 text-[0.8rem] text-[var(--color-charcoal-700)] pb-2">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Visible
          </label>
        </div>
        {/* Image controls — available on every step kind. Shows the live
            diagram on the ivory tile the customizer uses, including the
            built-in fallback that ships with the storefront. Click to
            view full size, replace, or remove. */}
        {(() => {
          // What the storefront actually renders for this option today:
          // explicit upload wins; else the bundled PNG; else nothing.
          const effective = image || (!fallbackBroken ? staticFallback : "");
          const source = image
            ? "Uploaded by admin"
            : !fallbackBroken && staticFallback
              ? "Built-in diagram (default)"
              : "No image yet";
          return (
            <div className="flex items-center gap-4 flex-wrap">
              <div className="w-14 h-14 bg-[var(--color-ivory-100)] border border-black/10 grid place-items-center overflow-hidden">
                {effective ? (
                  <a href={effective} target="_blank" rel="noreferrer" title="View full size">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={effective}
                      alt=""
                      className="max-w-full max-h-full object-contain"
                      onError={() => {
                        // Static asset missing for this value — fall back
                        // to the "No image" state so the admin isn't
                        // misled into thinking one exists.
                        if (!image) setFallbackBroken(true);
                      }}
                    />
                  </a>
                ) : (
                  <span className="text-[0.55rem] uppercase tracking-[0.12em] text-[var(--color-charcoal-400)]">No image</span>
                )}
              </div>
              <div className="flex flex-col gap-1 min-w-0">
                <label className="text-eyebrow inline-flex items-center gap-2 border border-black/20 px-4 py-2.5 cursor-pointer hover:border-[var(--color-burgundy-700)] transition-colors w-fit">
                  <Upload size={13} strokeWidth={1.5} />
                  {uploading ? "Cleaning + uploading…" : image ? "Replace image" : "Upload custom image"}
                  <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleUpload} className="hidden" />
                </label>
                <span className="text-[0.66rem] uppercase tracking-[0.12em] text-[var(--color-charcoal-500)]">
                  {source}
                </span>
              </div>
              {image && (
                <button
                  type="button"
                  onClick={() => setImage("")}
                  className="text-[0.72rem] tracking-wide uppercase text-[var(--color-charcoal-400)] hover:text-[var(--color-burgundy-700)] self-start mt-1"
                  title="Revert to the built-in diagram (or no image if there isn't one)"
                >
                  Remove
                </button>
              )}
              <span className="text-[0.7rem] text-[var(--color-charcoal-500)] basis-full">
                White background is removed automatically on upload. Removing reverts to the built-in diagram.
              </span>
            </div>
          );
        })()}
        <Field label="Note (optional)"><input value={note} onChange={(e) => setNote(e.target.value)} className={inputCls + " w-full max-w-md"} /></Field>
        <div className="flex gap-2 pt-1">
          <button onClick={save} disabled={busy} className="text-eyebrow inline-flex items-center gap-2 bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] px-4 py-2.5 hover:bg-[var(--color-burgundy-800)] disabled:opacity-60">
            <Check size={13} strokeWidth={1.5} /> {busy ? "Saving…" : "Save"}
          </button>
          <button onClick={() => setEditing(false)} className="text-eyebrow inline-flex items-center gap-2 border border-black/20 px-4 py-2.5 hover:border-[var(--color-burgundy-700)]">
            <X size={13} strokeWidth={1.5} /> Cancel
          </button>
        </div>
      </div>
    );
  }

  async function quickToggle() {
    setBusy(true);
    try {
      await updateOption(option.id, { active: !option.active });
      await onChanged();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`group flex items-center gap-3 px-5 py-2.5 text-[0.85rem] ${!option.active ? "opacity-50" : ""}`}>
      <OptionThumb stepSlug={stepSlug} stepKind={stepKind} value={option.value} color={option.color} image={option.image_url} />
      <span className="text-[var(--color-charcoal-900)] flex-1 min-w-0">
        {option.label}
        {!option.active && <em className="text-[0.7rem] text-[var(--color-charcoal-400)] ml-2 not-italic">· hidden</em>}
      </span>
      {confirmDel ? (
        <span className="inline-flex items-center gap-2">
          <button onClick={remove} disabled={busy} className="text-[0.72rem] tracking-wide uppercase text-[var(--color-burgundy-700)]">Confirm</button>
          <button onClick={() => setConfirmDel(false)} className="text-[0.72rem] tracking-wide uppercase text-[var(--color-charcoal-400)]">No</button>
        </span>
      ) : (
        <span className="inline-flex items-center gap-1">
          <button
            onClick={quickToggle}
            disabled={busy}
            aria-label={option.active ? "Disable" : "Enable"}
            title={option.active ? "Click to hide from site" : "Click to show on site"}
            className={`p-1.5 transition-colors ${
              option.active
                ? "text-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-800)]"
                : "text-[var(--color-charcoal-400)] hover:text-[var(--color-burgundy-700)]"
            }`}
          >
            {option.active ? <Eye size={14} strokeWidth={1.5} /> : <EyeOff size={14} strokeWidth={1.5} />}
          </button>
          <button onClick={() => setEditing(true)} aria-label="Edit" className="p-1.5 opacity-40 group-hover:opacity-100 transition-opacity hover:text-[var(--color-burgundy-700)]"><Pencil size={13} strokeWidth={1.5} /></button>
          <button onClick={() => setConfirmDel(true)} aria-label="Delete" className="p-1.5 opacity-40 group-hover:opacity-100 transition-opacity hover:text-[var(--color-burgundy-700)]"><Trash2 size={13} strokeWidth={1.5} /></button>
        </span>
      )}
    </div>
  );
}

/* ── Add option ── */
function AddOption({
  stepSlug, stepKind, existingValues, onAdded,
}: {
  stepSlug: string;
  stepKind: string;
  existingValues: string[];
  onAdded: () => Promise<void> | void;
}) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [color, setColor] = useState("");
  // Image picked by the admin. We alpha-key it client-side BEFORE upload
  // so the storefront only ever sees a transparent PNG — the white card
  // backgrounds that ship with most stock vector exports get dropped
  // automatically so the option diagrams blend with the customizer's
  // ivory page.
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handlePickFile(f: File | null) {
    setErr(null);
    if (!f) { setFile(null); setPreview(null); return; }
    try {
      const cleaned = await alphaKeyToPng(f);
      setFile(cleaned);
      setPreview(URL.createObjectURL(cleaned));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't process that image.");
    }
  }

  async function add() {
    if (!label.trim()) { setErr("Give the option a label."); return; }
    // The internal value is auto-generated from the label (slugified +
    // de-duped within this step) — the atelier never types a code.
    const existing = new Set(existingValues);
    const base = toSlug(label) || "option";
    let value = base;
    let n = 2;
    while (existing.has(value)) { value = `${base}-${n}`; n++; }
    setBusy(true); setErr(null);
    try {
      let image_url: string | null = null;
      if (file) image_url = await uploadOptionImage(file);
      await insertOption({
        step_slug: stepSlug,
        value,
        label: label.trim(),
        color: stepKind === "swatch" ? (color.trim() || null) : null,
        image_url,
      });
      setOpen(false);
      setLabel(""); setColor("");
      setFile(null); setPreview(null);
      await onAdded();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to add.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="w-full flex items-center gap-2 px-5 py-3 text-eyebrow text-[var(--color-burgundy-700)] hover:bg-[var(--color-ivory-200)]/50 transition-colors">
        <Plus size={14} strokeWidth={1.5} /> Add option
      </button>
    );
  }
  return (
    <div className="px-5 py-4 bg-[var(--color-ivory-200)]/60 space-y-3">
      <div className="flex flex-wrap items-end gap-4">
        <Field label="Label (what the customer sees)"><input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Full lining" className={inputCls + " w-72"} /></Field>
        {stepKind === "swatch" && (
          <Field label="Colour (hex)"><input value={color} onChange={(e) => setColor(e.target.value)} placeholder="#6e2639" className={inputCls + " w-32"} /></Field>
        )}
      </div>

      {/* Image picker. The preview tile uses the same ivory bg as the
          customizer card so admin sees exactly how the diagram will read
          after the auto-key — no surprises. */}
      <div className="flex items-center gap-4">
        <Field label="Diagram (auto-transparent)">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => handlePickFile(e.target.files?.[0] ?? null)}
            className="mt-1 text-[0.85rem] text-[var(--color-charcoal-700)] file:mr-3 file:px-3 file:py-1.5 file:border file:border-black/15 file:bg-[var(--color-ivory-100)] file:text-eyebrow file:text-[0.65rem] hover:file:border-[var(--color-burgundy-700)]"
          />
        </Field>
        {preview && (
          <div className="flex items-center gap-2 text-[0.7rem] text-[var(--color-charcoal-500)]">
            <div className="relative w-14 h-14 bg-[var(--color-ivory-100)] border border-black/10 grid place-items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="preview" className="max-w-full max-h-full object-contain" />
            </div>
            <span>White removed.<br />Same tile as customizer.</span>
          </div>
        )}
      </div>

      {err && <p className="text-[0.8rem] text-[var(--color-burgundy-700)]">{err}</p>}
      <div className="flex gap-2 pt-1">
        <button onClick={add} disabled={busy} className="text-eyebrow inline-flex items-center gap-2 bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] px-4 py-2.5 hover:bg-[var(--color-burgundy-800)] disabled:opacity-60">
          <Plus size={13} strokeWidth={1.5} /> {busy ? "Adding…" : "Add option"}
        </button>
        <button onClick={() => setOpen(false)} className="text-eyebrow inline-flex items-center gap-2 border border-black/20 px-4 py-2.5 hover:border-[var(--color-burgundy-700)]">Cancel</button>
      </div>
    </div>
  );
}

const inputCls = "mt-1 bg-[var(--color-ivory-100)] border border-black/15 px-3 py-2 text-[0.9rem] text-[var(--color-charcoal-900)] focus:outline-none focus:border-[var(--color-burgundy-700)]";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col text-[0.7rem] tracking-[0.12em] uppercase text-[var(--color-charcoal-500)]">
      {label}
      {children}
    </label>
  );
}

function Badge({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "burgundy" }) {
  return (
    <span
      className={`text-[0.65rem] tracking-[0.15em] uppercase px-2 py-1 ${
        tone === "burgundy"
          ? "bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)]"
          : "bg-[var(--color-ivory-200)] text-[var(--color-charcoal-600)]"
      }`}
    >
      {children}
    </span>
  );
}
