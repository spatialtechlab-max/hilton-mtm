"use client";

import { useState } from "react";
import { ArrowRight, Lock } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

/**
 * Reusable sign-in / create-account form backed by Supabase auth.
 * Email + password and Continue-with-Google. On a successful password sign-in
 * (or a sign-up that returns a session) it calls onSuccess. Google sign-in
 * redirects away and resumes via the auth state listener on return.
 */
export function AuthForm({
  onSuccess,
  redirectTo,
}: {
  onSuccess?: () => void;
  redirectTo?: string;
}) {
  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const redirect = redirectTo ?? (typeof window !== "undefined" ? window.location.href : undefined);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (!isSupabaseConfigured) {
      setError("Authentication isn't configured yet. Please try again shortly.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) { setError(error.message); return; }
        onSuccess?.();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
            emailRedirectTo: redirect,
          },
        });
        if (error) { setError(error.message); return; }
        // Welcome email fires from AuthProvider on SIGNED_IN (handles
        // every signup path — password, OAuth, email-link confirm —
        // through a single hook), so no per-form fetch here.
        if (data.session) {
          onSuccess?.();
        } else {
          setNotice("Check your inbox to confirm your email, then sign in.");
          setMode("signin");
        }
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleForgot() {
    setError(null); setNotice(null);
    if (!email.trim()) { setError("Enter your email above first."); return; }
    setLoading(true);
    // Send via our own branded Resend email (the house template) instead of
    // Supabase's default "Supabase Auth" message. The server generates the
    // recovery link with the admin API and emails it. Redirect target is the
    // dedicated set-a-new-password page.
    const redirectTo =
      typeof window !== "undefined" ? `${window.location.origin}/account/reset` : undefined;
    try {
      await fetch("/api/notify/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, redirectTo }),
      });
    } catch { /* the notice below is shown regardless, so we don't leak status */ }
    setLoading(false);
    setNotice("Check your email for a password reset link.");
  }

  async function handleGoogle() {
    setError(null);
    if (!isSupabaseConfigured) {
      setError("Authentication isn't configured yet. Please try again shortly.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirect },
    });
    if (error) { setError(error.message); setLoading(false); }
    // On success the browser redirects to Google; no further work here.
  }

  return (
    <div>
      {/* Sign in / Create account toggle */}
      <div className="grid grid-cols-2 border border-black/15">
        {(["signin", "register"] as const).map((m) => {
          const active = m === mode;
          return (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setError(null); setNotice(null); }}
              className={`text-eyebrow py-3 transition-colors ${
                active
                  ? "bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)]"
                  : "text-[var(--color-charcoal-800)] hover:text-[var(--color-burgundy-700)]"
              }`}
            >
              {m === "signin" ? "Sign in" : "Create account"}
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {mode === "register" && (
          <Field label="Full name" type="text" autoComplete="name" value={name} onChange={setName} required />
        )}
        <Field label="Email" type="email" autoComplete="email" value={email} onChange={setEmail} required />
        <Field
          label="Password"
          type="password"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          value={password}
          onChange={setPassword}
          required
          minLength={6}
        />

        {mode === "signin" && (
          <div className="text-right">
            <button
              type="button"
              onClick={handleForgot}
              disabled={loading}
              className="text-[0.8rem] text-[var(--color-charcoal-500)] hover:text-[var(--color-burgundy-700)] transition-colors disabled:opacity-60"
            >
              Forgot password?
            </button>
          </div>
        )}

        {error && (
          <p className="text-[0.85rem] text-[var(--color-burgundy-700)] bg-[var(--color-burgundy-50)] border border-[var(--color-burgundy-700)]/20 px-3 py-2">
            {error}
          </p>
        )}
        {notice && (
          <p className="text-[0.85rem] text-[var(--color-charcoal-800)] bg-[var(--color-ivory-200)] px-3 py-2">
            {notice}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full text-eyebrow inline-flex items-center justify-center gap-3 bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] px-8 py-4 hover:bg-[var(--color-burgundy-800)] transition-colors disabled:opacity-60"
        >
          {loading ? "Please wait…" : mode === "signin" ? "Sign in & continue" : "Create account & continue"}
          {!loading && <ArrowRight size={16} strokeWidth={1.5} />}
        </button>
      </form>

      <div className="mt-7 flex items-center gap-4 text-[var(--color-charcoal-400)]">
        <div className="flex-1 h-px bg-black/10" />
        <span className="text-eyebrow">or</span>
        <div className="flex-1 h-px bg-black/10" />
      </div>

      <button
        type="button"
        onClick={handleGoogle}
        disabled={loading}
        className="mt-7 w-full text-eyebrow inline-flex items-center justify-center gap-3 border border-[var(--color-charcoal-900)]/25 text-[var(--color-charcoal-900)] px-8 py-4 hover:border-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-700)] transition-colors disabled:opacity-60"
      >
        <GoogleMark /> Continue with Google
      </button>

      <p className="mt-7 flex items-center justify-center gap-2 text-[0.78rem] text-[var(--color-charcoal-500)]">
        <Lock size={12} strokeWidth={1.5} /> Your details are encrypted and never shared.
      </p>
    </div>
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

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}
