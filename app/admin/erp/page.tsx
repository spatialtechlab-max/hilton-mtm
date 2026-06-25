"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, ChevronDown, ChevronRight, Search, AlertCircle, Code2, ImageOff, LogOut } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { isAdmin, isOperator } from "@/lib/admin";
import { supabase } from "@/lib/supabase";

type ErpItem = Record<string, unknown> & {
  id: number;
  name?: string;
  code?: string;
  status?: string;
  categoryID: number;
  categoryName?: string;
  thumbnail?: string;
  images?: string[];
};
type CategoryGroup = { categoryID: number; categoryName: string; count: number; active: number; inactive: number };
type BrandGroup = { brandID: number; brandName: string; count: number };
type ErpRaw = {
  fetchedAt: string;
  erpTotal: number;
  counts: { items: number; active: number; inactive: number; categories: number; brands: number };
  categories: CategoryGroup[];
  brands: BrandGroup[];
  items: ErpItem[];
};
type ImgFilter = "all" | "has" | "needs";

const isUrl = (v: unknown): v is string => typeof v === "string" && /^https?:\/\//i.test(v);

/** "Has images" = at least one real garment photo in images[]. The fabric
 *  swatch thumbnail does NOT count, per the spec. */
const hasGarmentImages = (it: ErpItem): boolean => ((it.images as string[] | undefined) ?? []).some(isUrl);

function valueText(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (Array.isArray(v)) return v.length ? v.map((x) => String(x)).join("\n") : "[] (empty)";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

export default function AdminErpPage() {
  const { user, loading, signOut } = useAuth();
  // access: null = checking; otherwise { ok, admin }. Admins OR operators may
  // view this tool; everyone else is blocked. Operators see only this page.
  const [access, setAccess] = useState<{ ok: boolean; admin: boolean } | null>(null);
  const [data, setData] = useState<ErpRaw | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [imgFilter, setImgFilter] = useState<ImgFilter>("all");
  const [openCats, setOpenCats] = useState<Set<number>>(new Set());
  const [openJson, setOpenJson] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!user) { setAccess({ ok: false, admin: false }); return; }
    Promise.all([isAdmin(user.email), isOperator(user.email)]).then(([a, o]) => setAccess({ ok: a || o, admin: a }));
  }, [user]);

  const load = useCallback(async () => {
    setLoadingData(true); setError(null);
    try {
      const { data: s } = await supabase.auth.getSession();
      const token = s.session?.access_token;
      if (!token) { setError("Sign in required."); setLoadingData(false); return; }
      const res = await fetch("/api/admin/erp-raw", { headers: { Authorization: `Bearer ${token}` } });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { setError(body?.error || `Request failed (${res.status}).`); setData(null); }
      else setData(body as ErpRaw);
    } catch {
      setError("Could not load ERP data.");
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => { if (access?.ok) load(); }, [access, load]);

  const itemsByCat = useMemo(() => {
    const m = new Map<number, ErpItem[]>();
    for (const it of data?.items ?? []) {
      const arr = m.get(it.categoryID) ?? [];
      arr.push(it);
      m.set(it.categoryID, arr);
    }
    return m;
  }, [data]);

  const needsCount = useMemo(() => (data?.items ?? []).filter((it) => !hasGarmentImages(it)).length, [data]);

  const query = q.trim().toLowerCase();
  const passFilter = useCallback((it: ErpItem) => {
    if (imgFilter === "has" && !hasGarmentImages(it)) return false;
    if (imgFilter === "needs" && hasGarmentImages(it)) return false;
    if (!query) return true;
    return Object.values(it).some((v) => String(v ?? "").toLowerCase().includes(query));
  }, [query, imgFilter]);

  const visibleCategories = useMemo(() => {
    if (!data) return [];
    const active = imgFilter !== "all" || !!query;
    if (!active) return data.categories;
    return data.categories.filter((c) => (itemsByCat.get(c.categoryID) ?? []).some(passFilter));
  }, [data, query, imgFilter, itemsByCat, passFilter]);

  const toggleCat = (id: number) => setOpenCats((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const toggleJson = (id: number) => setOpenJson((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const catOpen = (id: number) => (query || imgFilter !== "all" ? true : openCats.has(id));

  const isAdminUser = !!access?.admin;
  const shellProps = isAdminUser ? {} : { backHref: "/", backLabel: "The House", onSignOut: signOut };

  if (loading || access === null) return <Shell {...shellProps}><p className="text-eyebrow text-[var(--color-charcoal-500)]">Loading…</p></Shell>;
  if (!user)        return <Shell {...shellProps}><p>Sign in to continue.</p></Shell>;
  if (!access.ok)   return <Shell {...shellProps}><p>{user.email} isn&rsquo;t authorised for this tool.</p></Shell>;

  return (
    <Shell {...shellProps}>
      <header className="mb-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-eyebrow text-[var(--color-burgundy-700)]">{isAdminUser ? "Admin · ERP" : "Operator · ERP"}</span>
            <h1 className="text-display text-[clamp(2rem,4vw,3rem)] mt-2 leading-tight">ERP products &amp; categories</h1>
            <p className="mt-3 text-[0.9rem] text-[var(--color-charcoal-500)] max-w-2xl">
              The complete live feed from the ERP. Use the filter to find products that still
              need a photographed image, fetched fresh on each load.
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            disabled={loadingData}
            className="text-eyebrow inline-flex items-center gap-2 border border-[var(--color-charcoal-900)] px-5 py-3 hover:border-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-700)] transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} strokeWidth={1.5} className={loadingData ? "animate-spin" : ""} /> {loadingData ? "Fetching…" : "Refresh"}
          </button>
        </div>
      </header>

      {error && (
        <p className="mb-6 text-[0.85rem] text-[var(--color-burgundy-700)] bg-[var(--color-burgundy-50)] border border-[var(--color-burgundy-700)]/20 px-3 py-2 inline-flex items-center gap-2">
          <AlertCircle size={14} strokeWidth={1.5} /> {error}
        </p>
      )}

      {loadingData && !data ? (
        <p className="text-eyebrow text-[var(--color-charcoal-500)]">Fetching the ERP feed…</p>
      ) : !data ? null : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            <Stat label="Items" value={data.counts.items} />
            <Stat label="Need images" value={needsCount} accent />
            <Stat label="Have images" value={data.counts.items - needsCount} />
            <Stat label="Categories" value={data.counts.categories} />
            <Stat label="Brands" value={data.counts.brands} />
          </div>
          <p className="text-[0.72rem] text-[var(--color-charcoal-400)] mb-6 tabular-nums">
            ERP reported total: {data.erpTotal} · fetched {new Date(data.fetchedAt).toLocaleString()}
          </p>

          {/* Filter + search */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="inline-flex border border-black/15">
              {(["all", "has", "needs"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setImgFilter(f)}
                  className={`text-eyebrow px-4 py-2.5 transition-colors ${
                    imgFilter === f
                      ? "bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)]"
                      : "text-[var(--color-charcoal-800)] hover:text-[var(--color-burgundy-700)]"
                  }`}
                >
                  {f === "all" ? "All" : f === "has" ? "Has images" : "Needs images"}
                </button>
              ))}
            </div>
            <div className="relative flex-1 min-w-[220px] max-w-md">
              <Search size={15} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-charcoal-400)]" />
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search any field — name, code, colour, brand, status…"
                className="w-full pl-9 pr-3 py-2.5 border border-black/15 bg-[var(--color-ivory-100)] focus:outline-none focus:border-[var(--color-burgundy-700)] text-[0.9rem]"
              />
            </div>
          </div>

          {/* Categories (A–Z), expandable */}
          <div className="border-y border-black/10 divide-y divide-black/10">
            {visibleCategories.length === 0 && (
              <p className="py-6 text-[0.85rem] text-[var(--color-charcoal-500)]">Nothing matches the current filter.</p>
            )}
            {visibleCategories.map((cat) => {
              const all = itemsByCat.get(cat.categoryID) ?? [];
              const items = all.filter(passFilter);
              const needs = all.filter((it) => !hasGarmentImages(it)).length;
              const open = catOpen(cat.categoryID);
              return (
                <section key={cat.categoryID}>
                  <button
                    type="button"
                    onClick={() => toggleCat(cat.categoryID)}
                    className="w-full flex items-center justify-between gap-4 py-4 text-left hover:text-[var(--color-burgundy-700)] transition-colors"
                  >
                    <span className="flex items-center gap-3 min-w-0">
                      {open ? <ChevronDown size={16} strokeWidth={1.5} /> : <ChevronRight size={16} strokeWidth={1.5} />}
                      <span className="text-display text-[1.15rem] text-[var(--color-charcoal-900)] truncate">{cat.categoryName}</span>
                      <span className="text-[0.7rem] text-[var(--color-charcoal-400)] tabular-nums">ID {cat.categoryID}</span>
                      {needs > 0 && (
                        <span className="text-eyebrow text-[var(--color-burgundy-700)] bg-[var(--color-burgundy-50)] px-2 py-0.5 inline-flex items-center gap-1">
                          <ImageOff size={11} strokeWidth={1.8} /> {needs} need
                        </span>
                      )}
                    </span>
                    <span className="text-[0.75rem] text-[var(--color-charcoal-500)] tabular-nums whitespace-nowrap">
                      {imgFilter !== "all" || query ? `${items.length} / ` : ""}{cat.count} item{cat.count === 1 ? "" : "s"}
                    </span>
                  </button>

                  {open && (
                    <div className="pb-5 space-y-4">
                      {items.map((it) => (
                        <ItemCard key={it.id} item={it} jsonOpen={openJson.has(it.id)} onToggleJson={() => toggleJson(it.id)} />
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </>
      )}
    </Shell>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`border px-4 py-3 ${accent && value > 0 ? "border-[var(--color-burgundy-700)]/40 bg-[var(--color-burgundy-50)]" : "border-black/10"}`}>
      <div className="text-eyebrow text-[var(--color-charcoal-500)]">{label}</div>
      <div className={`text-display text-[1.6rem] tabular-nums mt-1 ${accent && value > 0 ? "text-[var(--color-burgundy-700)]" : "text-[var(--color-charcoal-900)]"}`}>{value}</div>
    </div>
  );
}

function ItemCard({ item, jsonOpen, onToggleJson }: { item: ErpItem; jsonOpen: boolean; onToggleJson: () => void }) {
  const images = [item.thumbnail, ...((item.images as string[] | undefined) ?? [])].filter(isUrl);
  const active = item.status === "A";
  const needs = !hasGarmentImages(item);
  const entries = Object.entries(item);
  return (
    <div className={`border ${needs ? "border-[var(--color-burgundy-700)]/30" : "border-black/10"} bg-[var(--color-ivory-100)]/40`}>
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-black/10">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-[0.7rem] tabular-nums text-[var(--color-charcoal-400)]">#{String(item.id)}</span>
          <span className="text-display text-[1rem] text-[var(--color-charcoal-900)] truncate">{String(item.name ?? "(no name)")}</span>
          {item.code ? <span className="text-[0.72rem] text-[var(--color-charcoal-500)]">{String(item.code)}</span> : null}
          {needs && (
            <span className="text-eyebrow px-2 py-0.5 text-[var(--color-burgundy-700)] bg-[var(--color-burgundy-50)] inline-flex items-center gap-1">
              <ImageOff size={11} strokeWidth={1.8} /> Needs image
            </span>
          )}
          <span className={`text-eyebrow px-2 py-0.5 ${active ? "text-[var(--color-charcoal-500)] bg-black/5" : "text-[var(--color-charcoal-500)] bg-black/5"}`}>
            {active ? "Active" : `Status ${String(item.status ?? "?")}`}
          </span>
        </div>
        <button type="button" onClick={onToggleJson} className="text-eyebrow inline-flex items-center gap-1.5 text-[var(--color-charcoal-500)] hover:text-[var(--color-burgundy-700)] transition-colors">
          <Code2 size={13} strokeWidth={1.5} /> {jsonOpen ? "Hide JSON" : "Raw JSON"}
        </button>
      </div>

      {images.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 pt-4">
          {images.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={src} alt="" className="h-20 w-20 object-cover border border-black/10 bg-white" loading="lazy" />
          ))}
        </div>
      )}

      <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2 px-4 py-4 text-[0.82rem]">
        {entries.map(([k, v]) => (
          <div key={k} className="min-w-0">
            <dt className="text-eyebrow text-[var(--color-charcoal-400)]">{k}</dt>
            <dd className="text-[var(--color-charcoal-900)] break-words whitespace-pre-wrap">{valueText(v)}</dd>
          </div>
        ))}
      </dl>

      {jsonOpen && (
        <pre className="mx-4 mb-4 p-3 bg-[var(--color-charcoal-900)] text-[var(--color-ivory-100)] text-[0.72rem] leading-relaxed overflow-x-auto rounded-sm">
          {JSON.stringify(item, null, 2)}
        </pre>
      )}
    </div>
  );
}

function Shell({ children, backHref = "/admin", backLabel = "Admin", onSignOut }: { children: React.ReactNode; backHref?: string; backLabel?: string; onSignOut?: () => void }) {
  return (
    <div className="pt-32 md:pt-40 pb-24 min-h-[80vh]">
      <div className="container-editorial">
        <div className="flex items-center justify-between mb-8">
          <Link href={backHref} className="inline-flex items-center gap-2 text-eyebrow text-[var(--color-charcoal-500)] hover:text-[var(--color-burgundy-700)] transition-colors">
            <ArrowLeft size={14} strokeWidth={1.5} /> {backLabel}
          </Link>
          {onSignOut && (
            <button type="button" onClick={onSignOut} className="inline-flex items-center gap-2 text-eyebrow text-[var(--color-charcoal-500)] hover:text-[var(--color-burgundy-700)] transition-colors">
              <LogOut size={14} strokeWidth={1.5} /> Sign out
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
