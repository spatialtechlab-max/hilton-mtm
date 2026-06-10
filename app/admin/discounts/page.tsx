"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Plus, Trash2, Save, Tag, CalendarDays, Percent, Power } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { isAdmin } from "@/lib/admin";
import {
  CODE_REGEX,
  isValidCodeFormat,
  listAllDiscountCodes,
  upsertDiscountCode,
  deleteDiscountCode,
  type DiscountCode,
} from "@/lib/discountCodes";

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

/** Format a "YYYY-MM-DDTHH:mm" local-time string for the datetime-local
 *  input from an ISO timestamp coming back from Supabase. */
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(local: string): string {
  // Treat the datetime-local value as wall-clock in the visitor's tz, then
  // emit an ISO with offset so the server stores it correctly.
  if (!local) return "";
  return new Date(local).toISOString();
}

function windowState(row: DiscountCode): "live" | "scheduled" | "expired" | "off" {
  if (!row.active) return "off";
  const now = Date.now();
  if (now < Date.parse(row.starts_at)) return "scheduled";
  if (now > Date.parse(row.ends_at)) return "expired";
  return "live";
}

const STATE_LABEL: Record<ReturnType<typeof windowState>, string> = {
  live: "Live",
  scheduled: "Scheduled",
  expired: "Expired",
  off: "Off",
};

const STATE_COLOR: Record<ReturnType<typeof windowState>, string> = {
  live:      "bg-emerald-100 text-emerald-800 border-emerald-200",
  scheduled: "bg-amber-100 text-amber-800 border-amber-200",
  expired:   "bg-stone-100 text-stone-600 border-stone-200",
  off:       "bg-stone-100 text-stone-500 border-stone-200",
};

export default function AdminDiscountsPage() {
  const { user, loading } = useAuth();
  const [admin, setAdmin] = useState<boolean | null>(null);
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editor state. `editing.id` is the row being edited; null = the
  // "add new" form at the top of the table.
  const [editing, setEditing] = useState<DiscountCode | null>(null);
  const [draft, setDraft] = useState<{
    code: string;
    percent_off: string;
    starts_at: string;
    ends_at: string;
    active: boolean;
  }>(() => emptyDraft());

  useEffect(() => {
    if (!user) { setAdmin(false); return; }
    isAdmin(user.email).then(setAdmin);
  }, [user]);

  useEffect(() => {
    if (!admin) return;
    let cancelled = false;
    (async () => {
      setLoadingData(true);
      setError(null);
      try {
        const rows = await listAllDiscountCodes();
        if (!cancelled) setCodes(rows);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load discount codes.");
      } finally {
        if (!cancelled) setLoadingData(false);
      }
    })();
    return () => { cancelled = true; };
  }, [admin]);

  function emptyDraft() {
    const now = new Date();
    const inAMonth = new Date();
    inAMonth.setDate(now.getDate() + 30);
    const fmt = (d: Date) => toLocalInput(d.toISOString());
    return {
      code: "",
      percent_off: "20",
      starts_at: fmt(now),
      ends_at: fmt(inAMonth),
      active: true,
    };
  }

  function startEdit(row: DiscountCode) {
    setEditing(row);
    setDraft({
      code: row.code,
      percent_off: String(row.percent_off),
      starts_at: toLocalInput(row.starts_at),
      ends_at:   toLocalInput(row.ends_at),
      active:    row.active,
    });
  }

  function cancelEdit() {
    setEditing(null);
    setDraft(emptyDraft());
  }

  async function handleSave() {
    setError(null);
    const code = draft.code.trim().toUpperCase();
    if (!isValidCodeFormat(code)) {
      setError("Code must be exactly 5 characters — the first 3 letters or digits, the last 2 must be digits.");
      return;
    }
    const percent = Number(draft.percent_off);
    if (!Number.isFinite(percent) || percent < 1 || percent > 99) {
      setError("Discount must be between 1% and 99%.");
      return;
    }
    if (!draft.starts_at || !draft.ends_at) {
      setError("Both a start and an end date are required.");
      return;
    }
    if (new Date(draft.ends_at).getTime() <= new Date(draft.starts_at).getTime()) {
      setError("The end date must be after the start date.");
      return;
    }
    try {
      const saved = await upsertDiscountCode(
        {
          code,
          percent_off: percent,
          starts_at: fromLocalInput(draft.starts_at),
          ends_at:   fromLocalInput(draft.ends_at),
          active:    draft.active,
        },
        editing?.id,
      );
      setCodes((prev) => {
        if (editing) return prev.map((r) => (r.id === saved.id ? saved : r));
        return [saved, ...prev];
      });
      cancelEdit();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save that code. It may already exist.");
    }
  }

  async function handleDelete(row: DiscountCode) {
    if (!confirm(`Remove ${row.code}? Customers will no longer be able to use it.`)) return;
    try {
      await deleteDiscountCode(row.id);
      setCodes((prev) => prev.filter((r) => r.id !== row.id));
      if (editing?.id === row.id) cancelEdit();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't remove that code.");
    }
  }

  const sorted = useMemo(() => codes, [codes]);

  if (loading || admin === null) {
    return <Shell><p className="text-eyebrow text-[var(--color-charcoal-500)]">Loading…</p></Shell>;
  }
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
        <h1 className="text-display text-[clamp(2rem,4vw,3rem)]">Not authorised</h1>
      </Shell>
    );
  }

  return (
    <Shell>
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 border-b border-black/10 pb-8">
        <div>
          <span className="text-eyebrow text-[var(--color-burgundy-700)]">Atelier Admin</span>
          <h1 className="text-display text-[clamp(2rem,4vw,3rem)] mt-2 leading-tight inline-flex items-center gap-3">
            <Tag size={26} strokeWidth={1.5} className="text-[var(--color-burgundy-700)]" />
            Discount codes
          </h1>
          <p className="mt-3 text-[0.9rem] text-[var(--color-charcoal-500)] max-w-2xl">
            Five-character codes — the first three are anything (letters or digits), the last two are numeric.
            Discounts are a flat percentage off the order subtotal, time-bound between a start and end date.
            Customers enter the code at checkout.
          </p>
        </div>
      </header>

      {error && (
        <p className="mt-6 text-[0.85rem] text-[var(--color-burgundy-700)] bg-[var(--color-burgundy-50)] border border-[var(--color-burgundy-700)]/20 px-3 py-2">
          {error}
        </p>
      )}

      {/* Editor — sits at the top, doubles as add-new + edit-existing */}
      <section className="mt-10 border border-black/10 bg-[var(--color-ivory-100)]">
        <div className="px-6 py-4 border-b border-black/10 flex items-center justify-between gap-4">
          <h2 className="text-eyebrow text-[var(--color-burgundy-700)] inline-flex items-center gap-2">
            <Plus size={14} strokeWidth={1.5} />
            {editing ? `Editing ${editing.code}` : "New discount code"}
          </h2>
          <div className="flex items-center gap-5">
            <label className="inline-flex items-center gap-2 text-[0.85rem] text-[var(--color-charcoal-800)]">
              <input
                type="checkbox"
                checked={draft.active}
                onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
                className="w-4 h-4 accent-[var(--color-burgundy-700)]"
              />
              <span className="inline-flex items-center gap-1.5">
                <Power size={12} strokeWidth={1.5} /> Active
              </span>
            </label>
            {editing && (
              <button
                type="button"
                onClick={cancelEdit}
                className="text-eyebrow text-[var(--color-charcoal-500)] hover:text-[var(--color-burgundy-700)] transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
        <div className="px-6 py-6 flex flex-wrap items-start gap-x-5 gap-y-4">
          <label className="block w-32">
            <span className="text-eyebrow text-[var(--color-charcoal-500)]">Code</span>
            <input
              type="text"
              value={draft.code}
              onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase().slice(0, 5) })}
              placeholder="DIS25"
              maxLength={5}
              pattern={CODE_REGEX.source}
              className="mt-2 w-full bg-white border border-black/15 px-3 py-2.5 text-[0.95rem] tabular-nums tracking-[0.18em] uppercase focus:outline-none focus:border-[var(--color-burgundy-700)]"
            />
            <span className="block mt-1 text-[0.7rem] text-[var(--color-charcoal-500)]">5 chars · last 2 digits</span>
          </label>
          <label className="block w-24">
            <span className="text-eyebrow text-[var(--color-charcoal-500)] inline-flex items-center gap-1.5">
              <Percent size={12} strokeWidth={1.5} /> Percent
            </span>
            <input
              type="number"
              min={1}
              max={99}
              value={draft.percent_off}
              onChange={(e) => setDraft({ ...draft, percent_off: e.target.value })}
              className="mt-2 w-full bg-white border border-black/15 px-3 py-2.5 text-[0.95rem] tabular-nums focus:outline-none focus:border-[var(--color-burgundy-700)]"
            />
          </label>
          <label className="block w-56">
            <span className="text-eyebrow text-[var(--color-charcoal-500)] inline-flex items-center gap-1.5">
              <CalendarDays size={12} strokeWidth={1.5} /> Starts
            </span>
            <input
              type="datetime-local"
              value={draft.starts_at}
              onChange={(e) => setDraft({ ...draft, starts_at: e.target.value })}
              className="mt-2 w-full bg-white border border-black/15 px-3 py-2.5 text-[0.95rem] focus:outline-none focus:border-[var(--color-burgundy-700)]"
            />
          </label>
          <label className="block w-56">
            <span className="text-eyebrow text-[var(--color-charcoal-500)] inline-flex items-center gap-1.5">
              <CalendarDays size={12} strokeWidth={1.5} /> Ends
            </span>
            <input
              type="datetime-local"
              value={draft.ends_at}
              onChange={(e) => setDraft({ ...draft, ends_at: e.target.value })}
              className="mt-2 w-full bg-white border border-black/15 px-3 py-2.5 text-[0.95rem] focus:outline-none focus:border-[var(--color-burgundy-700)]"
            />
          </label>
          {/* Spacer pushes the action button to the right edge while keeping
              it aligned with the input rows above. The pt-[1.45rem] matches
              the eyebrow + mt-2 height so the button starts at the same
              vertical line as the inputs. */}
          <div className="ml-auto pt-[1.45rem]">
            <button
              type="button"
              onClick={handleSave}
              className="text-eyebrow inline-flex items-center justify-center gap-2 bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] px-5 py-2.5 hover:bg-[var(--color-burgundy-800)] transition-colors"
            >
              <Save size={13} strokeWidth={1.5} /> {editing ? "Update code" : "Create code"}
            </button>
          </div>
        </div>
      </section>

      {/* Existing codes table */}
      <section className="mt-10">
        <h2 className="text-eyebrow text-[var(--color-charcoal-500)] mb-5">All codes</h2>
        {loadingData ? (
          <p className="text-eyebrow text-[var(--color-charcoal-500)]">Loading…</p>
        ) : sorted.length === 0 ? (
          <div className="border border-black/10 bg-[var(--color-ivory-200)] px-6 py-8 text-[0.9rem] text-[var(--color-charcoal-700)]">
            No discount codes yet. Create one above and customers can redeem it at checkout.
          </div>
        ) : (
          <ul className="border-y border-black/10 divide-y divide-black/10">
            {sorted.map((row) => {
              const s = windowState(row);
              return (
                <li key={row.id} className="py-5 grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-12 sm:col-span-3">
                    <div className="text-display text-[1.15rem] tabular-nums tracking-[0.18em]">{row.code}</div>
                    <div className="text-eyebrow text-[var(--color-burgundy-700)] mt-1">{row.percent_off}% off</div>
                  </div>
                  <div className="col-span-7 sm:col-span-5 text-[0.85rem] text-[var(--color-charcoal-700)]">
                    {new Date(row.starts_at).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    {" → "}
                    {new Date(row.ends_at).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </div>
                  <div className="col-span-3 sm:col-span-2">
                    <span className={`inline-flex items-center gap-1.5 text-eyebrow text-[0.65rem] px-2 py-1 border ${STATE_COLOR[s]}`}>
                      {STATE_LABEL[s]}
                    </span>
                  </div>
                  <div className="col-span-2 sm:col-span-2 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => startEdit(row)}
                      className="text-eyebrow text-[var(--color-charcoal-500)] hover:text-[var(--color-burgundy-700)] transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(row)}
                      className="text-eyebrow text-[var(--color-charcoal-500)] hover:text-[var(--color-burgundy-700)] transition-colors inline-flex items-center gap-1"
                      aria-label={`Delete ${row.code}`}
                    >
                      <Trash2 size={13} strokeWidth={1.5} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </Shell>
  );
}
