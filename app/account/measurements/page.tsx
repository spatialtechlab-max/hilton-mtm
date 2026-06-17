"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Save, Check, Ruler } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { AuthForm } from "@/components/AuthForm";
import { MeasurementsForm } from "@/components/MeasurementsForm";
import {
  fetchMyMeasurements, saveMyMeasurements, countSavedMeasurements,
} from "@/lib/measurements";
import { allMeasurements, type MeasurementUnit, type MeasurementValues } from "@/lib/customizer";

/**
 * Customer-facing "save my measurements once" page.
 * Pre-fills from mtm_measurements on mount, saves back on demand. The
 * customizer reads from the same row at checkout so the customer
 * never has to re-enter their numbers (though they can override per
 * order if their build has changed).
 */
export default function MeasurementsPage() {
  const { user, loading: authLoading } = useAuth();
  const [values, setValues] = useState<MeasurementValues>({});
  const [unit, setUnit] = useState<MeasurementUnit>("cm");
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const row = await fetchMyMeasurements();
      if (cancelled) return;
      if (row) {
        setValues(row.values ?? {});
        setUnit(row.unit ?? "cm");
        setSavedAt(row.updated_at);
      }
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [user]);

  if (authLoading) {
    return (
      <div className="pt-40 pb-24 min-h-[70vh] container-editorial text-eyebrow text-[var(--color-charcoal-500)]">
        Loading…
      </div>
    );
  }
  if (!user) {
    return (
      <div className="pt-32 md:pt-40 pb-24 min-h-[80vh] container-editorial">
        <Link
          href="/account"
          className="inline-flex items-center gap-2 text-eyebrow text-[var(--color-charcoal-500)] hover:text-[var(--color-burgundy-700)] transition-colors mb-8"
        >
          <ArrowLeft size={14} strokeWidth={1.5} /> Your account
        </Link>
        <span className="text-eyebrow text-[var(--color-burgundy-700)]">Measurements</span>
        <h1 className="text-display text-[clamp(2rem,4vw,3rem)] mt-2 max-w-2xl leading-tight">
          Sign in to save your tape-measure flow.
        </h1>
        <p className="mt-5 max-w-lg text-[0.95rem] text-[var(--color-charcoal-700)]">
          Your measurements stay attached to your account. Every future commission pre-fills the numbers so you only take the tape out once.
        </p>
        <div className="mt-8 max-w-md">
          <AuthForm />
        </div>
      </div>
    );
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const { error: err } = await saveMyMeasurements(values, unit);
    if (err) {
      setError(err);
      setSaving(false);
      return;
    }
    setSavedAt(new Date().toISOString());
    setSaving(false);
  }

  const filledCount = countSavedMeasurements(values);
  const totalCount = allMeasurements.length;
  const isComplete = filledCount === totalCount;

  return (
    <div className="pt-32 md:pt-40 pb-24 min-h-[80vh]">
      <div className="container-editorial">
        <Link
          href="/account"
          className="inline-flex items-center gap-2 text-eyebrow text-[var(--color-charcoal-500)] hover:text-[var(--color-burgundy-700)] transition-colors mb-8"
        >
          <ArrowLeft size={14} strokeWidth={1.5} /> Your account
        </Link>

        <header className="border-b border-black/10 pb-8 mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <span className="text-eyebrow text-[var(--color-burgundy-700)]">Measurements</span>
            <h1 className="text-display text-[clamp(2rem,4vw,3.25rem)] mt-2 leading-tight inline-flex items-center gap-3">
              <Ruler size={26} strokeWidth={1.5} className="text-[var(--color-burgundy-700)]" />
              Your tape on file.
            </h1>
            <p className="mt-4 max-w-2xl text-[0.95rem] text-[var(--color-charcoal-700)] leading-relaxed">
              Take your measurements once with the short clips below. Every commission you place
              after this pre-fills these numbers, so you never have to dig the tape out again
              unless your build changes.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 text-[0.85rem] text-[var(--color-charcoal-500)]">
              <Ruler size={13} strokeWidth={1.5} />
              {filledCount} of {totalCount} entered
              {savedAt && (
                <span className="text-[var(--color-charcoal-400)] ml-2">
                  · last saved {new Date(savedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="text-eyebrow inline-flex items-center justify-center gap-2 bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] px-6 py-3.5 hover:bg-[var(--color-burgundy-800)] transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {saving ? "Saving…" : <><Save size={14} strokeWidth={1.5} /> Save measurements</>}
          </button>
        </header>

        {error && (
          <p className="mb-6 text-[0.85rem] text-[var(--color-burgundy-700)] bg-[var(--color-burgundy-50)] border border-[var(--color-burgundy-700)]/20 px-3 py-2">
            {error}
          </p>
        )}
        {!error && savedAt && (
          <p className="mb-6 text-[0.85rem] text-[var(--color-burgundy-700)] inline-flex items-center gap-2">
            <Check size={13} strokeWidth={1.8} />
            {isComplete ? "Tape-measure flow is complete." : "Saved. You can keep adding numbers any time."}
          </p>
        )}

        {loaded ? (
          <MeasurementsForm
            values={values}
            unit={unit}
            onSetValue={(slug, v) => setValues((p) => ({ ...p, [slug]: v }))}
            onSetUnit={setUnit}
          />
        ) : (
          <p className="text-eyebrow text-[var(--color-charcoal-500)]">Loading…</p>
        )}

        {/* "Prefer in-person? Book a fitting" hidden per atelier request (code kept). */}
        <div className="hidden mt-16 pt-8 border-t border-black/10 flex-col md:flex-row md:items-center justify-between gap-4">
          <p className="text-[0.85rem] text-[var(--color-charcoal-500)] max-w-xl">
            Prefer in-person? Book a fitting and the master tailor will take every measurement at the atelier.
          </p>
          <Link
            href="/book"
            className="text-eyebrow inline-flex items-center gap-2 border border-[var(--color-burgundy-700)] text-[var(--color-burgundy-700)] px-5 py-3 hover:bg-[var(--color-burgundy-700)] hover:text-[var(--color-ivory-100)] transition-colors"
          >
            Book a fitting
          </Link>
        </div>
      </div>
    </div>
  );
}
