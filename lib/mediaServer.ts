/**
 * Server-side reader for the mtm_media overrides table. Used by the
 * server-rendered MediaImage component so the HTML ships with the
 * atelier-uploaded URL already in place — no flash of the static
 * fallback while the client hydrates.
 *
 * Lives in a non-client module (no "use client") and talks to Supabase
 * over REST so it works in server components, route handlers, and at
 * build/ISR time. The mtm_media table has public-read RLS so the anon
 * key is enough.
 */

const REVALIDATE_SECS = 60;

type MediaRow = { slot: string; url: string; alt: string | null };

export async function fetchMediaSlotServer(slot: string): Promise<MediaRow | null> {
  if (!slot) return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  try {
    const res = await fetch(
      `${url}/rest/v1/mtm_media?slot=eq.${encodeURIComponent(slot)}&select=slot,url,alt`,
      {
        headers: { apikey: anon, Authorization: `Bearer ${anon}` },
        next: { revalidate: REVALIDATE_SECS },
      },
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as MediaRow[];
    return rows[0] ?? null;
  } catch {
    return null;
  }
}
