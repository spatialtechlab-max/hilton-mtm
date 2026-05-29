import { createClient } from "@supabase/supabase-js";

/**
 * Browser Supabase client. Uses the public anon/publishable key — safe to ship
 * to the client; data access is governed by row-level security in Supabase.
 * Session is persisted in localStorage and auto-refreshed.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase = createClient(url ?? "", anonKey ?? "", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
