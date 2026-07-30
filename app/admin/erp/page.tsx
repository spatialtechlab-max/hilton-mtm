"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, ChevronDown, ChevronRight, Search, AlertCircle, Code2, ImageOff, LogOut, Upload, UploadCloud, Check, Sparkles, Loader2 } from "lucide-react";
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

// Categories we generate for (garments). Everything else is an accessory and
// gets no upload. Mirrors lib/erpGenerate.ts (server enforces it too).
const GARMENT_CATEGORIES = new Set([
  "SUITING", "SUITINGS", "SUITS", "JACKETING", "JACKET", "BLAZER", "OVERCOAT",
  "PANTS", "CHINO PANTS", "TROUSER", "SHIRTING", "SHIRTS",
]);
const isGarment = (categoryName: unknown) => GARMENT_CATEGORIES.has(String(categoryName ?? "").trim().toUpperCase());

type GenImages = { swatch: string | null; front: string | null; back: string | null };

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

      {needs && isGarment(item.categoryName) && <GenPanel item={item} />}

      {jsonOpen && (
        <pre className="mx-4 mb-4 p-3 bg-[var(--color-charcoal-900)] text-[var(--color-ivory-100)] text-[0.72rem] leading-relaxed overflow-x-auto rounded-sm">
          {JSON.stringify(item, null, 2)}
        </pre>
      )}
    </div>
  );
}

const SLOTS = ["swatch", "front", "back"] as const;
type Slot = (typeof SLOTS)[number];
const SLOT_LABEL: Record<Slot, string> = { swatch: "Swatch", front: "Front", back: "Back" };
const MAX_BATCHES = 4;

function GenPanel({ item }: { item: ErpItem }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  // Every generation attempt is kept as a batch; the operator picks one image
  // per slot (swatch/front/back) across all batches before pushing.
  const [batches, setBatches] = useState<GenImages[]>([]);
  const [sel, setSel] = useState<Record<Slot, number | null>>({ swatch: null, front: null, back: null });
  const [pushing, setPushing] = useState(false);
  const [pushed, setPushed] = useState(false);
  const [pushErr, setPushErr] = useState<string | null>(null);
  const [pushMsg, setPushMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const multi = batches.length > 1;

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (batches.length >= MAX_BATCHES) { setErr(`You can generate up to ${MAX_BATCHES} batches. Pick your images and push, or refresh to start over.`); return; }
    const newIdx = batches.length; // index the incoming batch will occupy
    setBusy(true); setErr(null);
    setPushed(false); setPushErr(null); setPushMsg(null);
    try {
      const { data: s } = await supabase.auth.getSession();
      const token = s.session?.access_token;
      if (!token) { setErr("Sign in required."); return; }
      const fd = new FormData();
      fd.append("itemId", String(item.id));
      fd.append("fabric", file);
      const res = await fetch("/api/admin/erp-generate", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setErr(data?.error || "Generation failed."); return; }
      const images = data.images as GenImages;
      setBatches((prev) => [...prev, images]);
      // Auto-fill any slot that is still unpicked and this batch can cover. The
      // first batch fills everything it has (so a clean batch needs zero clicks);
      // later batches only fill the gaps, and the operator can re-pick any slot.
      setSel((prev) => ({
        swatch: prev.swatch ?? (images.swatch ? newIdx : null),
        front: prev.front ?? (images.front ? newIdx : null),
        back: prev.back ?? (images.back ? newIdx : null),
      }));
    } catch {
      setErr("Generation failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function pick(slot: Slot, batchIdx: number) {
    setPushed(false); setPushErr(null); setPushMsg(null);
    setSel((prev) => ({ ...prev, [slot]: batchIdx }));
  }

  const chosen: Record<Slot, string | null> = {
    swatch: sel.swatch != null ? batches[sel.swatch]?.swatch ?? null : null,
    front: sel.front != null ? batches[sel.front]?.front ?? null : null,
    back: sel.back != null ? batches[sel.back]?.back ?? null : null,
  };
  const complete = !!(chosen.swatch && chosen.front && chosen.back);

  async function pushToErp() {
    if (!complete) return;
    const barcode = String(item.barcode ?? "").trim();
    if (!barcode) { setPushErr("This item has no barcode in the ERP, so it can't be matched."); return; }
    setPushing(true); setPushErr(null); setPushMsg(null);
    try {
      const { data: s } = await supabase.auth.getSession();
      const token = s.session?.access_token;
      if (!token) { setPushErr("Sign in required."); return; }
      // Stage the chosen images on the VPS, in catalogue order (front = hero).
      const slots: Array<[Slot, string | null]> = [["front", chosen.front], ["back", chosen.back], ["swatch", chosen.swatch]];
      const urls: string[] = [];
      for (const [slot, dataUrl] of slots) {
        if (!dataUrl) continue;
        const hr = await fetch("/api/admin/erp-host", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ dataUrl, slot }),
        });
        const hd = await hr.json().catch(() => ({}));
        if (!hr.ok || !hd.url) { setPushErr(hd?.error || `Could not stage the ${slot} image.`); return; }
        urls.push(hd.url as string);
      }
      if (urls.length === 0) { setPushErr("No images selected to push."); return; }
      const pr = await fetch("/api/admin/erp-push", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ barcode, images: urls }),
      });
      const pd = await pr.json().catch(() => ({}));
      if (!pr.ok || !pd.pushed) { setPushErr(pd?.error || "Push to the ERP failed."); return; }
      setPushed(true);
      setPushMsg(`Pushed ${pd.count} image${pd.count === 1 ? "" : "s"} to the ERP — now live. The catalogue updates within a few minutes.`);
    } catch {
      setPushErr("Push failed. Please try again.");
    } finally {
      setPushing(false);
    }
  }

  return (
    <div className="mx-4 mb-4 border-t border-black/10 pt-4">
      <div className="flex flex-wrap items-center gap-3">
        <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy || batches.length >= MAX_BATCHES}
          className="text-eyebrow inline-flex items-center gap-2 bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] px-4 py-2.5 hover:bg-[var(--color-burgundy-800)] transition-colors disabled:opacity-60"
        >
          {busy ? <Loader2 size={14} strokeWidth={1.5} className="animate-spin" /> : <Upload size={14} strokeWidth={1.5} />}
          {busy ? "Generating…" : batches.length === 0 ? "Upload fabric & generate" : "Upload another fabric"}
        </button>
        <span className="text-[0.78rem] text-[var(--color-charcoal-500)] inline-flex items-center gap-1.5">
          <Sparkles size={12} strokeWidth={1.5} /> Phone photo of the cloth → clean swatch + front + back, on white.
          {batches.length > 0 && <span className="tabular-nums">· batch {batches.length} of {MAX_BATCHES}</span>}
        </span>
      </div>

      {err && <p className="mt-3 text-[0.82rem] text-[var(--color-burgundy-700)] bg-[var(--color-burgundy-50)] border border-[var(--color-burgundy-700)]/20 px-3 py-2">{err}</p>}
      {busy && <p className="mt-3 text-[0.78rem] text-[var(--color-charcoal-500)]">Generating 3 images with the AI — this takes around a minute.</p>}

      {batches.length > 0 && (
        <div className="mt-4 space-y-5">
          {multi && (
            <p className="text-[0.78rem] text-[var(--color-charcoal-500)]">
              Pick the best <b>swatch</b>, <b>front</b> and <b>back</b> across the batches below (tap an image to choose it). All three must be chosen to push.
            </p>
          )}
          {batches.map((b, bi) => (
            <div key={bi}>
              {multi && <div className="text-eyebrow text-[var(--color-charcoal-400)] mb-2">Batch {bi + 1}</div>}
              <div className="grid grid-cols-3 gap-3 max-w-2xl">
                {SLOTS.map((slot) => {
                  const src = b[slot];
                  const selected = sel[slot] === bi && !!src;
                  const selectable = multi && !!src;
                  return (
                    <figure
                      key={slot}
                      onClick={selectable ? () => pick(slot, bi) : undefined}
                      className={`relative border bg-white transition-colors ${
                        selected ? "border-[var(--color-burgundy-700)] ring-2 ring-[var(--color-burgundy-700)]" : "border-black/10"
                      } ${selectable ? "cursor-pointer hover:border-[var(--color-burgundy-700)]" : ""}`}
                    >
                      {src ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={src} alt={SLOT_LABEL[slot]} className="w-full aspect-square object-contain bg-white" />
                      ) : (
                        <div className="w-full aspect-square flex items-center justify-center text-[0.72rem] text-[var(--color-charcoal-400)]">not generated</div>
                      )}
                      {selected && (
                        <span className="absolute top-1.5 right-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)]">
                          <Check size={12} strokeWidth={2.5} />
                        </span>
                      )}
                      <figcaption className={`text-eyebrow text-center py-1.5 ${selected ? "text-[var(--color-burgundy-700)]" : "text-[var(--color-charcoal-500)]"}`}>
                        {SLOT_LABEL[slot]}{selected && multi ? " · chosen" : ""}
                      </figcaption>
                    </figure>
                  );
                })}
              </div>
            </div>
          ))}

          {multi && (
            <div className="text-[0.75rem] text-[var(--color-charcoal-500)] flex flex-wrap gap-x-4 gap-y-1">
              {SLOTS.map((slot) => (
                <span key={slot} className="inline-flex items-center gap-1.5">
                  {chosen[slot]
                    ? <Check size={12} strokeWidth={2} className="text-[var(--color-burgundy-700)]" />
                    : <span className="inline-block w-3 h-3 border border-[var(--color-charcoal-400)] rounded-full" />}
                  {SLOT_LABEL[slot]}: {chosen[slot] ? `batch ${(sel[slot] ?? 0) + 1}` : "not chosen"}
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={pushToErp}
              disabled={pushing || pushed || !complete}
              title="Stages the chosen swatch, front and back, pushes them into the ERP (matched by barcode), then deletes the temporary copies."
              className="text-eyebrow inline-flex items-center gap-2 bg-[var(--color-charcoal-900)] text-[var(--color-ivory-100)] px-4 py-2 hover:bg-[var(--color-burgundy-700)] transition-colors disabled:opacity-40"
            >
              {pushing ? <Loader2 size={14} strokeWidth={1.5} className="animate-spin" /> : pushed ? <Check size={14} strokeWidth={1.5} /> : <UploadCloud size={14} strokeWidth={1.5} />}
              {pushing ? "Pushing…" : pushed ? "Pushed — live" : "Push to ERP"}
            </button>
            {pushMsg ? (
              <span className="text-[0.72rem] text-green-700">{pushMsg}</span>
            ) : pushErr ? (
              <span className="text-[0.72rem] text-[var(--color-burgundy-700)]">{pushErr}</span>
            ) : !complete ? (
              <span className="text-[0.72rem] text-[var(--color-charcoal-400)]">
                {multi ? "Choose a swatch, a front and a back to enable the push." : "Waiting on all three images. Upload another fabric to fill any gap, then choose."}
              </span>
            ) : (
              <span className="text-[0.72rem] text-[var(--color-charcoal-400)]">Pushes the chosen swatch, front and back into the ERP (matched by barcode). The temporary copies are deleted right after.</span>
            )}
          </div>
        </div>
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
