"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Plus, Trash2, Truck, Globe } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { isAdmin } from "@/lib/admin";
import {
  listFreeShippingCountries,
  addFreeShippingCountry,
  deleteFreeShippingCountry,
  type FreeShippingCountry,
} from "@/lib/shippingZones";
import { SHIPPING_FEE } from "@/lib/checkoutFees";

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

export default function AdminShippingPage() {
  const { user, loading } = useAuth();
  const [admin, setAdmin] = useState<boolean | null>(null);
  const [rows, setRows] = useState<FreeShippingCountry[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

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
      const list = await listFreeShippingCountries();
      if (!cancelled) {
        setRows(list);
        setLoadingData(false);
      }
    })();
    return () => { cancelled = true; };
  }, [admin]);

  async function handleAdd() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setSaving(true);
    setError(null);
    const { error: err } = await addFreeShippingCountry(trimmed);
    if (err) {
      setError(
        err.includes("duplicate") || err.includes("unique")
          ? `${trimmed} is already on the free-shipping list.`
          : err,
      );
      setSaving(false);
      return;
    }
    const list = await listFreeShippingCountries();
    setRows(list);
    setDraft("");
    setSaving(false);
  }

  async function handleDelete(row: FreeShippingCountry) {
    if (!confirm(`Remove ${row.country} from the free-shipping list? Future orders shipping to ${row.country} will be charged the flat BHD ${SHIPPING_FEE} delivery fee.`)) return;
    setError(null);
    const { error: err } = await deleteFreeShippingCountry(row.id);
    if (err) { setError(err); return; }
    setRows((prev) => prev.filter((r) => r.id !== row.id));
  }

  if (loading || admin === null) {
    return <Shell><p className="text-eyebrow text-[var(--color-charcoal-500)]">Loading…</p></Shell>;
  }
  if (!user) {
    return (
      <Shell>
        <h1 className="text-display text-[clamp(2rem,4vw,3rem)]">Access restricted</h1>
        <p className="mt-4 text-[0.95rem] text-[var(--color-charcoal-700)]">
          Please <Link href="/account" className="text-[var(--color-burgundy-700)] underline">sign in</Link> with an admin account.
        </p>
      </Shell>
    );
  }
  if (!admin) {
    return (
      <Shell>
        <h1 className="text-display text-[clamp(2rem,4vw,3rem)]">Access restricted</h1>
        <p className="mt-4 text-[0.95rem] text-[var(--color-charcoal-700)]">
          This area is reserved for the atelier. If you have an account here, please continue shopping or visit <Link href="/account" className="text-[var(--color-burgundy-700)] underline">your account</Link> instead.
        </p>
      </Shell>
    );
  }

  return (
    <Shell>
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 border-b border-black/10 pb-8">
        <div>
          <h1 className="text-display text-[clamp(2rem,4vw,3rem)] leading-tight inline-flex items-center gap-3">
            <Truck size={26} strokeWidth={1.5} className="text-[var(--color-burgundy-700)]" />
            Free-shipping countries
          </h1>
          <p className="mt-3 text-[0.9rem] text-[var(--color-charcoal-500)] max-w-2xl">
            Orders shipping to a country on this list are delivered free. Anywhere else,
            the flat BHD {SHIPPING_FEE} delivery fee applies. The customer&apos;s shipping address
            (saved at checkout) decides which rate they see.
          </p>
        </div>
      </header>

      {error && (
        <p className="mt-6 text-[0.85rem] text-[var(--color-burgundy-700)] bg-[var(--color-burgundy-50)] border border-[var(--color-burgundy-700)]/20 px-3 py-2">
          {error}
        </p>
      )}

      <section className="mt-10 border border-black/10 bg-[var(--color-ivory-100)]">
        <div className="px-6 py-4 border-b border-black/10">
          <h2 className="text-eyebrow text-[var(--color-burgundy-700)] inline-flex items-center gap-2">
            <Plus size={14} strokeWidth={1.5} /> Add a country
          </h2>
        </div>
        <div className="px-6 py-6 flex flex-wrap items-end gap-4">
          <label className="block flex-1 min-w-[260px]">
            <span className="text-eyebrow text-[var(--color-charcoal-500)] inline-flex items-center gap-1.5">
              <Globe size={12} strokeWidth={1.5} /> Country name
            </span>
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void handleAdd(); } }}
              placeholder="Bahrain"
              className="mt-2 w-full bg-white border border-black/15 px-3 py-2.5 text-[0.95rem] focus:outline-none focus:border-[var(--color-burgundy-700)]"
            />
            <span className="block mt-1 text-[0.7rem] text-[var(--color-charcoal-500)]">
              Case-insensitive. &ldquo;Bahrain&rdquo; matches &ldquo;bahrain&rdquo; and &ldquo;BAHRAIN&rdquo;.
            </span>
          </label>
          <button
            type="button"
            onClick={handleAdd}
            disabled={saving || !draft.trim()}
            className="text-eyebrow inline-flex items-center justify-center gap-2 bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] px-5 py-2.5 hover:bg-[var(--color-burgundy-800)] transition-colors disabled:opacity-50"
          >
            <Plus size={13} strokeWidth={1.5} /> {saving ? "Adding…" : "Add country"}
          </button>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-eyebrow text-[var(--color-charcoal-500)] mb-5">Currently free for delivery</h2>
        {loadingData ? (
          <p className="text-eyebrow text-[var(--color-charcoal-500)]">Loading…</p>
        ) : rows.length === 0 ? (
          <div className="border border-black/10 bg-[var(--color-ivory-200)] px-6 py-8 text-[0.9rem] text-[var(--color-charcoal-700)]">
            No countries listed yet. Every order will be charged the flat BHD {SHIPPING_FEE} delivery fee.
          </div>
        ) : (
          <ul className="border-y border-black/10 divide-y divide-black/10">
            {rows.map((row) => (
              <li key={row.id} className="py-4 grid grid-cols-12 gap-3 items-center">
                <div className="col-span-12 sm:col-span-6">
                  <span className="text-display text-[1.15rem] text-[var(--color-charcoal-900)]">{row.country}</span>
                </div>
                <div className="col-span-6 sm:col-span-4 text-[0.78rem] text-[var(--color-charcoal-500)]">
                  Added {new Date(row.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </div>
                <div className="col-span-6 sm:col-span-2 justify-self-end">
                  <button
                    type="button"
                    onClick={() => handleDelete(row)}
                    aria-label={`Remove ${row.country}`}
                    className="text-eyebrow inline-flex items-center gap-2 text-[var(--color-charcoal-500)] hover:text-[var(--color-burgundy-700)] transition-colors"
                  >
                    <Trash2 size={13} strokeWidth={1.5} /> Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Shell>
  );
}
