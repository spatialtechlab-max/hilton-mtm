"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { clearCart } from "@/lib/cart";

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

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      setLoading(false);

      // Security hygiene: the cart lives in localStorage and isn't tied to an
      // account, so on sign-out we must wipe it. Otherwise the next person on
      // this browser (a different customer, or a guest) would inherit the
      // previous user's cart. Cleared on SIGNED_OUT only — never on sign-in —
      // so a guest who fills a cart and then signs in to check out keeps it.
      if (event === "SIGNED_OUT") {
        clearCart();
      }

      // Password reset: when the customer clicks the reset link in their
      // email, the recovery token is exchanged here and fires
      // PASSWORD_RECOVERY. Send them to the set-a-new-password page no
      // matter which allowed URL the link landed on — so the flow works
      // without depending on Supabase's redirect allowlist. The recovery
      // session persists in localStorage, so /account/reset picks it up.
      if (event === "PASSWORD_RECOVERY" && typeof window !== "undefined") {
        if (window.location.pathname !== "/account/reset") {
          window.location.assign("/account/reset");
        }
      }

      // Welcome email — fires on every SIGNED_IN regardless of the path
      // the user took (password signup, OAuth, email-link confirm,
      // returning sign-in). The server route is idempotent — it stamps
      // user_metadata.welcomed_at after the first send and short-circuits
      // on later calls, so re-firings cost nothing.
      if (event === "SIGNED_IN" && s?.access_token) {
        fetch("/api/notify/welcome", {
          method: "POST",
          headers: { Authorization: `Bearer ${s.access_token}` },
        }).catch(() => { /* non-blocking */ });
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    // Belt-and-braces alongside the SIGNED_OUT handler above, so the cart is
    // gone the moment sign-out resolves even if the event is slow to fire.
    clearCart();
  };

  return (
    <AuthContext.Provider value={{ user: session?.user ?? null, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
