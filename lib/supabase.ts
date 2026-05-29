import { createClient } from "@supabase/supabase-js";

/**
 * Browser Supabase client. Uses the public anon/publishable key — safe to ship
 * to the client; data access is governed by row-level security in Supabase.
 * Session is persisted in localStorage and auto-refreshed.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

// Fall back to harmless placeholders so the production build never throws
// when env vars aren't set yet (Supabase's constructor rejects empty URLs).
// Callers gate real usage on isSupabaseConfigured.
const SAFE_URL = url || "https://placeholder.supabase.co";
const SAFE_KEY = anonKey || "placeholder-anon-key";

export const supabase = createClient(SAFE_URL, SAFE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
