"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { fetchProfile, upsertProfile, type Profile } from "@/lib/orders";

/**
 * One-time profile completion form shown after sign-up. Captures the billing
 * details the atelier needs to ship a commission (Google OAuth doesn't return
 * phone numbers — restricted scope — so we ask for it here).
 */
export function ProfileForm({
  userId,
  initialName = "",
  onSaved,
  variant = "card",
}: {
  userId: string;
  initialName?: string;
  onSaved?: (p: Profile) => void;
  variant?: "card" | "inline";
}) {
  const [p, setP] = useState<Profile>({
    id:            userId,
    full_name:     initialName,
    phone:         "",
    address_line1: "",
    address_line2: "",
    city:          "",
    country:       "Bahrain",
  });
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchProfile(userId).then((existing) => {
      if (cancelled) return;
      if (existing) setP({ ...p, ...existing });
      setLoading(false);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const { error } = await upsertProfile(p);
    setSaving(false);
    if (error) { setError(error); return; }
    setSaved(true);
    onSaved?.(p);
    window.setTimeout(() => setSaved(false), 2200);
  }

  if (loading) {
    return <p className="text-eyebrow text-[var(--color-charcoal-500)]">Loading your profile…</p>;
  }

  const wrap = variant === "card"
    ? "border border-[var(--color-burgundy-700)]/30 bg-[var(--color-burgundy-50)] p-8 lg:p-10"
    : "";

  return (
    <div className={wrap}>
      {variant === "card" && (
        <>
          <span className="text-eyebrow text-[var(--color-burgundy-700)]">One last step</span>
          <h2 className="text-display text-[clamp(1.75rem,2.8vw,2.25rem)] mt-2 leading-tight">
            Complete your profile.
          </h2>
          <p className="mt-3 text-[0.95rem] text-[var(--color-charcoal-700)] leading-relaxed max-w-lg">
            We need your billing name, phone and address to confirm your fittings and deliver your
            commission. Stored once, used for every future order.
          </p>
        </>
      )}

      <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-5">
        <Field label="Full name (as on billing)" value={p.full_name}
               onChange={(v) => setP({ ...p, full_name: v })} required full />
        <Field label="Phone number" type="tel" value={p.phone} placeholder="+973 …"
               onChange={(v) => setP({ ...p, phone: v })} required />
        <Field label="City" value={p.city} onChange={(v) => setP({ ...p, city: v })} required />
        <Field label="Address line 1" value={p.address_line1}
               onChange={(v) => setP({ ...p, address_line1: v })} required full />
        <Field label="Address line 2 (optional)" value={p.address_line2}
               onChange={(v) => setP({ ...p, address_line2: v })} full />
        <Field label="Country" value={p.country} onChange={(v) => setP({ ...p, country: v })} required />

        {error && (
          <p className="md:col-span-2 text-[0.85rem] text-[var(--color-burgundy-700)] bg-[var(--color-burgundy-50)] border border-[var(--color-burgundy-700)]/20 px-3 py-2">
            {error}
          </p>
        )}

        <div className="md:col-span-2 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="text-eyebrow inline-flex items-center gap-3 bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] px-8 py-4 hover:bg-[var(--color-burgundy-800)] transition-colors disabled:opacity-60"
          >
            {saving ? "Saving…" : saved ? <><Check size={16} strokeWidth={1.5} /> Saved</> : <>Save & continue <ArrowRight size={16} strokeWidth={1.5} /></>}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label, value, onChange, required, type = "text", placeholder, full,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
  full?: boolean;
}) {
  return (
    <label className={`block ${full ? "md:col-span-2" : ""}`}>
      <span className="text-eyebrow text-[var(--color-charcoal-500)]">{label}</span>
      <input
        type={type}
        required={required}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full bg-[var(--color-ivory-100)] border border-black/15 px-4 py-3 text-[0.95rem] text-[var(--color-charcoal-900)] placeholder:text-[var(--color-charcoal-500)] focus:outline-none focus:border-[var(--color-burgundy-700)] transition-colors"
      />
    </label>
  );
}
