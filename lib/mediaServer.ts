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

/**
 * Legacy slot fallbacks. The homepage Categories tiles, library hero
 * and Design Yours picker were unified onto library.<slug>.cover, but
 * the atelier had already uploaded customised photos to the old
 * home.category.* keys. Read from the legacy key when the new one is
 * empty so existing customisations carry over without anyone having to
 * re-upload anything. Once the atelier uploads to the new key the
 * legacy fallback never wins again.
 */
const LEGACY_FALLBACK_SLOTS: Record<string, string> = {
  "library.suits.cover":    "home.category.suits",
  "library.jackets.cover":  "home.category.jackets",
  "library.shirts.cover":   "home.category.shirts",
  "library.trousers.cover": "home.category.trousers",
  "library.shoes.cover":    "home.category.shoes",
  "library.ties.cover":     "home.category.ties",
};

async function fetchOneSlot(slot: string): Promise<MediaRow | null> {
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

export async function fetchMediaSlotServer(slot: string): Promise<MediaRow | null> {
  if (!slot) return null;
  const direct = await fetchOneSlot(slot);
  if (direct?.url) return direct;
  const legacy = LEGACY_FALLBACK_SLOTS[slot];
  if (!legacy) return null;
  const carried = await fetchOneSlot(legacy);
  return carried?.url ? carried : null;
}
