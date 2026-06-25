"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { setCartUser } from "@/lib/cart";
import { OtpGate } from "./OtpGate";

type AuthState = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  // Second factor on EVERY login: a Supabase session isn't "in" until its id
  // is in mtm_verified_sessions. null = still checking, false = needs the gate,
  // true = cleared. Password logins are pre-cleared by their verify route;
  // Google / OAuth and any other session get challenged here.
  const [otpVerified, setOtpVerified] = useState<boolean | null>(null);
  // The password-recovery session (reset link) must reach /account/reset
  // without an OTP wall, or the customer can never set a new password.
  const [recovery, setRecovery] = useState(false);

  async function checkOtp(s: Session | null) {
    if (!s?.access_token) { setOtpVerified(null); return; }
    try {
      const r = await fetch("/api/auth/session-otp/status", {
        method: "POST",
        headers: { Authorization: `Bearer ${s.access_token}` },
      });
      const d = await r.json().catch(() => ({}));
      setOtpVerified(!!d?.verified);     // fail closed: anything but an explicit true gates
    } catch {
      setOtpVerified(false);
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
      setCartUser(data.session?.user?.id ?? null);
      checkOtp(data.session);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      setLoading(false);
      setCartUser(s?.user?.id ?? null);

      if (event === "PASSWORD_RECOVERY") {
        setRecovery(true);
        if (typeof window !== "undefined" && window.location.pathname !== "/account/reset") {
          window.location.assign("/account/reset");
        }
        return;                          // never gate the recovery session
      }

      if (event === "SIGNED_OUT") {
        setOtpVerified(null);
        setRecovery(false);
        return;
      }

      // Welcome email — idempotent server-side; fires on every SIGNED_IN.
      if (event === "SIGNED_IN" && s?.access_token) {
        fetch("/api/notify/welcome", {
          method: "POST",
          headers: { Authorization: `Bearer ${s.access_token}` },
        }).catch(() => { /* non-blocking */ });
      }

      // Re-check the second factor on a new sign-in. Token refreshes keep the
      // same session_id, so they don't need a re-check (leave the state as is).
      if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
        checkOtp(s);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setOtpVerified(null);
    setCartUser(null);
  };

  const onResetPath = typeof window !== "undefined" && window.location.pathname.startsWith("/account/reset");
  const exempt = recovery || onResetPath;
  const showGate     = !!session && !exempt && otpVerified === false;
  const showChecking = !!session && !exempt && otpVerified === null;

  return (
    <AuthContext.Provider value={{ user: session?.user ?? null, session, loading, signOut }}>
      {showGate ? (
        <OtpGate
          accessToken={session!.access_token}
          email={session!.user?.email ?? ""}
          onVerified={() => setOtpVerified(true)}
          onSignOut={signOut}
        />
      ) : showChecking ? (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-[var(--color-ivory-100)]">
          <p className="text-eyebrow text-[var(--color-charcoal-500)]">One moment…</p>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
