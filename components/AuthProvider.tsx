"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

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
  };

  return (
    <AuthContext.Provider value={{ user: session?.user ?? null, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
