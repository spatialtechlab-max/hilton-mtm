"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Database, RefreshCw, AlertTriangle, Lock, Pencil, Trash2, Plus, Check, X, Upload, Package, Layers, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { isAdmin } from "@/lib/admin";
import {
  fetchSteps, fetchOptions, seedFromConfig,
  updateOption, insertOption, deleteOption, uploadOptionImage,
  updateStep,
  type DbStep, type DbOption,
} from "@/lib/adminData";

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

type CategoryFilter = "all" | "jacket" | "trouser" | "shirt";

export default function AdminPage() {
  const { user, loading } = useAuth();
  const [admin, setAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) { setAdmin(false); return; }
    isAdmin(user.email).then(setAdmin);
  }, [user]);

  const [steps, setSteps] = useState<DbStep[] | null>(null);
  const [options, setOptions] = useState<DbOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [filter, setFilter] = useState<CategoryFilter>("all");

  const load = useCallback(async () => {
    setLoadingData(true);
    setError(null);
    try {
      const [s, o] = await Promise.all([fetchSteps(), fetchOptions()]);
      setSteps(s);
      setOptions(o);
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
          <h1 className="text-display text-[clamp(2rem,4vw,3rem)] mt-4">Not authorised</h1>
          <p className="mt-4 text-[0.95rem] text-[var(--color-charcoal-700)] leading-relaxed">
            The account <span className="text-[var(--color-charcoal-900)]">{user.email}</span> isn&rsquo;t on the admin
            list. Add it to the Supabase <code className="text-[0.85rem]">mtm_admins</code> table.
          </p>
        </div>
      </Shell>
    );
  }

  const stepCount = steps?.length ?? 0;
  const notConfigured = !error && stepCount === 0 && !loadingData && !busy;

  const visible = (steps ?? []).filter((s) => filter === "all" || s.applies_to.includes(filter));
  const filterCounts: Record<CategoryFilter, number> = {
    all: stepCount,
    jacket: (steps ?? []).filter((s) => s.applies_to.includes("jacket")).length,
    trouser: (steps ?? []).filter((s) => s.applies_to.includes("trouser")).length,
    shirt: (steps ?? []).filter((s) => s.applies_to.includes("shirt")).length,
  };

  return (
    <Shell>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 border-b border-black/10 pb-8">
        <div>
          <span className="text-eyebrow text-[var(--color-burgundy-700)]">Atelier Admin</span>
          <h1 className="text-display text-[clamp(2.25rem,4.5vw,3.5rem)] mt-3 leading-[1.02]">Customization options</h1>
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
            href="/admin/fabrics"
            className="text-eyebrow inline-flex items-center gap-2 border border-[var(--color-charcoal-900)] text-[var(--color-charcoal-900)] px-5 py-3 hover:border-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-700)] transition-colors"
          >
            <Layers size={14} strokeWidth={1.5} /> Fabrics
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
              {([
                ["all", "All steps"],
                ["jacket", "Jacket"],
                ["trouser", "Trouser"],
                ["shirt", "Shirt"],
              ] as [CategoryFilter, string][]).map(([key, label]) => {
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
                      {filterCounts[key]}
                    </span>
                  </button>
                );
              })}
            </nav>
            <p className="mt-6 text-[0.75rem] text-[var(--color-charcoal-400)] leading-relaxed hidden lg:block">
              Hover a row to edit or delete. Surcharge is the extra cost shown to the customer.
            </p>
          </aside>

          {/* Main — step cards in a masonry column layout (no height gaps) */}
          <div className="columns-1 xl:columns-2 gap-5 [&>*]:mb-5">
            {visible.map((s) => (
              <div key={s.slug} className="break-inside-avoid border border-black/10 bg-[var(--color-ivory-100)]">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-5 py-4 border-b border-black/10">
                  <span className="text-display text-[1.2rem] text-[var(--color-charcoal-900)]">{s.title}</span>
                  <Badge>{s.kind}</Badge>
                  <TierPicker slug={s.slug} tier={s.tier} onChanged={load} />
                  <span className="basis-full text-[0.7rem] text-[var(--color-charcoal-400)]">
                    {s.applies_to.join(" · ")}
                    {s.requires_slug && `  ·  shows if ${s.requires_slug}=${s.requires_value}`}
                  </span>
                </div>
                <div className="divide-y divide-black/5">
                  {(optionsByStep[s.slug] ?? []).map((o) => (
                    <OptionRow key={o.id} option={o} stepSlug={s.slug} stepKind={s.kind} onChanged={load} />
                  ))}
                  {(optionsByStep[s.slug] ?? []).length === 0 && (
                    <div className="px-5 py-3 text-[0.8rem] text-[var(--color-charcoal-400)] italic">No options yet</div>
                  )}
                  <AddOption stepSlug={s.slug} stepKind={s.kind} onAdded={load} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Shell>
  );
}

/* ── Tier picker (which package owns this step) ── */
function TierPicker({
  slug, tier, onChanged,
}: {
  slug: string;
  tier: string | null;
  onChanged: () => Promise<void> | void;
}) {
  const [busy, setBusy] = useState(false);
  const tones: Record<string, string> = {
    essential: "bg-[var(--color-burgundy-700)]/15 text-[var(--color-burgundy-700)]",
    signature: "bg-[var(--color-charcoal-900)]/85 text-[var(--color-ivory-100)]",
    bespoke:   "bg-[var(--color-charcoal-900)] text-[var(--color-ivory-100)]",
  };
  async function pick(next: string) {
    if (busy || next === (tier ?? "")) return;
    setBusy(true);
    try { await updateStep(slug, { tier: next }); await onChanged(); }
    finally { setBusy(false); }
  }
  return (
    <span className="inline-flex border border-black/10 overflow-hidden">
      {(["essential", "signature", "bespoke"] as const).map((t) => {
        const active = tier === t;
        return (
          <button
            key={t}
            type="button"
            onClick={() => pick(t)}
            disabled={busy}
            className={`text-eyebrow text-[0.6rem] px-2.5 py-1 transition-colors ${
              active ? tones[t] : "text-[var(--color-charcoal-500)] hover:bg-[var(--color-ivory-200)]"
            } ${busy ? "opacity-50" : ""}`}
          >
            {t}
          </button>
        );
      })}
    </span>
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
  const [surcharge, setSurcharge] = useState(String(option.surcharge));
  const [color, setColor] = useState(option.color ?? "");
  const [note, setNote] = useState(option.note ?? "");
  const [active, setActive] = useState(option.active);
  const [image, setImage] = useState(option.image_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadOptionImage(file);
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
        surcharge: Number(surcharge) || 0,
        color: stepKind === "swatch" ? (color.trim() || null) : option.color,
        image_url: stepKind === "gallery" ? (image.trim() || null) : option.image_url,
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
          <Field label="Surcharge (BHD)"><input type="number" min={0} step="1" value={surcharge} onChange={(e) => setSurcharge(e.target.value)} className={inputCls + " w-32"} /></Field>
          {stepKind === "swatch" && (
            <Field label="Colour (hex)"><input value={color} onChange={(e) => setColor(e.target.value)} placeholder="#6e2639" className={inputCls + " w-32"} /></Field>
          )}
          <label className="inline-flex items-center gap-2 text-[0.8rem] text-[var(--color-charcoal-700)] pb-2">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Visible
          </label>
        </div>
        {stepKind === "gallery" && (
          <div className="flex items-center gap-4">
            {image && <img src={image} alt="" className="w-14 h-14 object-cover border border-black/10" />}
            <label className="text-eyebrow inline-flex items-center gap-2 border border-black/20 px-4 py-2.5 cursor-pointer hover:border-[var(--color-burgundy-700)] transition-colors">
              <Upload size={13} strokeWidth={1.5} /> {uploading ? "Uploading…" : image ? "Replace image" : "Upload image"}
              <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
            </label>
            {image && <button type="button" onClick={() => setImage("")} className="text-[0.72rem] uppercase tracking-wide text-[var(--color-charcoal-400)] hover:text-[var(--color-burgundy-700)]">Remove</button>}
          </div>
        )}
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
      <code className="text-[0.72rem] text-[var(--color-charcoal-400)] hidden sm:inline">{option.value}</code>
      <span className={`tabular-nums w-24 text-right ${option.surcharge > 0 ? "text-[var(--color-burgundy-700)]" : "text-[var(--color-charcoal-400)]"}`}>
        {option.surcharge > 0 ? `+ BHD ${option.surcharge}` : "included"}
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
  stepSlug, stepKind, onAdded,
}: {
  stepSlug: string;
  stepKind: string;
  onAdded: () => Promise<void> | void;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [label, setLabel] = useState("");
  const [surcharge, setSurcharge] = useState("0");
  const [color, setColor] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function add() {
    if (!value.trim() || !label.trim()) { setErr("Value and label are required."); return; }
    setBusy(true); setErr(null);
    try {
      await insertOption({
        step_slug: stepSlug,
        value: value.trim(),
        label: label.trim(),
        surcharge: Number(surcharge) || 0,
        color: stepKind === "swatch" ? (color.trim() || null) : null,
      });
      setOpen(false); setValue(""); setLabel(""); setSurcharge("0"); setColor("");
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
        <Field label="Value"><input value={value} onChange={(e) => setValue(e.target.value)} placeholder="peak" className={inputCls + " w-40"} /></Field>
        <Field label="Label"><input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Peak lapel" className={inputCls + " w-56"} /></Field>
        <Field label="Surcharge (BHD)"><input type="number" min={0} step="1" value={surcharge} onChange={(e) => setSurcharge(e.target.value)} className={inputCls + " w-32"} /></Field>
        {stepKind === "swatch" && (
          <Field label="Colour (hex)"><input value={color} onChange={(e) => setColor(e.target.value)} placeholder="#6e2639" className={inputCls + " w-32"} /></Field>
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
