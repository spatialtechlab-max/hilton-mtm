"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

/**
 * Set-a-new-password page. This is where the password-reset email link lands
 * (AuthForm sends it here via resetPasswordForEmail's redirectTo). The
 * Supabase client has detectSessionInUrl on, so the recovery token in the
 * URL is exchanged for a short-lived session automatically and fires a
 * PASSWORD_RECOVERY event. With that session in place, updateUser({ password })
 * sets the new password. Without a valid link, we show an "expired link"
 * state instead of a dead form.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);   // a recovery session is active
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) { setChecking(false); return; }

    // The recovery token arrives in the URL hash and is processed
    // asynchronously by the client. Catch it either via the live event or by
    // reading the resulting session.
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === "PASSWORD_RECOVERY" || s) { setReady(true); setChecking(false); }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) { setReady(true); setChecking(false); }
    });

    // If no session has appeared after load, the link is missing, already
    // used, or expired. Allow time for the token exchange (and the
    // PASSWORD_RECOVERY redirect from another allowed URL) to complete.
    const t = setTimeout(() => setChecking(false), 5000);

    return () => { sub.subscription.unsubscribe(); clearTimeout(t); };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) { setError("Use at least 6 characters."); return; }
    if (password !== confirm) { setError("The two passwords don't match."); return; }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { setError(error.message); return; }

    setDone(true);
    // The user now has a valid session; send them into their account.
    setTimeout(() => router.push("/account"), 1400);
  }

  return (
    <section className="flex items-center justify-center min-h-[100svh] px-6 sm:px-10 pt-32 pb-20">
      <div className="w-full max-w-md">
        <Link
          href="/account"
          className="text-eyebrow text-[var(--color-charcoal-500)] hover:text-[var(--color-burgundy-700)] transition-colors"
        >
          ← Account
        </Link>

        <div className="mt-8 mb-8">
          <span className="text-eyebrow text-[var(--color-burgundy-700)]">Account</span>
          <h1 className="text-display text-[clamp(2.25rem,5vw,3.25rem)] mt-3 leading-[1.05]">
            Set a new password
          </h1>
          <p className="mt-3 text-[0.95rem] text-[var(--color-charcoal-700)] leading-relaxed">
            Choose a new password for your account. You&apos;ll be signed in once it&apos;s saved.
          </p>
        </div>

        {done ? (
          <p className="text-[0.9rem] text-[var(--color-charcoal-800)] bg-[var(--color-ivory-200)] px-4 py-3">
            Password updated. Taking you to your account…
          </p>
        ) : checking ? (
          <p className="text-[0.9rem] text-[var(--color-charcoal-500)]">Checking your reset link…</p>
        ) : ready ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field
              label="New password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={setPassword}
              required
              minLength={6}
            />
            <Field
              label="Confirm new password"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={setConfirm}
              required
              minLength={6}
            />

            {error && (
              <p className="text-[0.85rem] text-[var(--color-burgundy-700)] bg-[var(--color-burgundy-50)] border border-[var(--color-burgundy-700)]/20 px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full text-eyebrow inline-flex items-center justify-center gap-3 bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] px-8 py-4 hover:bg-[var(--color-burgundy-800)] transition-colors disabled:opacity-60"
            >
              {loading ? "Saving…" : "Save new password"}
              {!loading && <ArrowRight size={16} strokeWidth={1.5} />}
            </button>

            <p className="mt-2 flex items-center justify-center gap-2 text-[0.78rem] text-[var(--color-charcoal-500)]">
              <Lock size={12} strokeWidth={1.5} /> Your details are encrypted and never shared.
            </p>
          </form>
        ) : (
          <div className="space-y-4">
            <p className="text-[0.9rem] text-[var(--color-charcoal-800)] bg-[var(--color-ivory-200)] px-4 py-3">
              This reset link is invalid or has expired. Reset links can only be used once.
              Request a fresh one from the sign-in page.
            </p>
            <Link
              href="/account"
              className="w-full text-eyebrow inline-flex items-center justify-center gap-3 border border-[var(--color-charcoal-900)]/25 text-[var(--color-charcoal-900)] px-8 py-4 hover:border-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-700)] transition-colors"
            >
              Back to sign in <ArrowRight size={14} strokeWidth={1.5} />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

function Field({
  label, type, autoComplete, value, onChange, required, minLength,
}: {
  label: string;
  type: string;
  autoComplete?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <label className="block">
      <span className="text-eyebrow text-[var(--color-charcoal-500)]">{label}</span>
      <input
        type={type}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full bg-[var(--color-ivory-100)] border border-black/15 px-4 py-3.5 text-[1rem] text-[var(--color-charcoal-900)] placeholder:text-[var(--color-charcoal-500)] focus:outline-none focus:border-[var(--color-burgundy-700)] transition-colors"
      />
    </label>
  );
}
