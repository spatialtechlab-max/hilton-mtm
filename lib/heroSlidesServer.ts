/**
 * Server-side reader for mtm_hero_slides. The homepage uses this so the
 * initial HTML ships with the real slide list embedded — no flash of an
 * empty hero while the client hydrates. Public-read RLS on the table
 * makes the anon key sufficient.
 */

const REVALIDATE_SECS = 60;

export type HeroSlideRow = {
  id: string;
  image_url: string;
  alt: string | null;
  position: number;
  active: boolean;
};

export async function fetchActiveHeroSlidesServer(): Promise<HeroSlideRow[]> {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return [];
  try {
    const res = await fetch(
      `${url}/rest/v1/mtm_hero_slides?active=eq.true&select=id,image_url,alt,position,active&order=position.asc,created_at.asc`,
      {
        headers: { apikey: anon, Authorization: `Bearer ${anon}` },
        next: { revalidate: REVALIDATE_SECS },
      },
    );
    if (!res.ok) return [];
    return (await res.json()) as HeroSlideRow[];
  } catch {
    return [];
  }
}
