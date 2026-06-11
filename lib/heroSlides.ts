"use client";

import { supabase } from "./supabase";
import { uploadEditorialImage } from "./media";

export type HeroSlide = {
  id: string;
  image_url: string;
  alt: string | null;
  position: number;
  active: boolean;
  created_at: string;
  updated_at: string;
};

/** House policy: at most this many slides in the rotating hero banner.
 *  Anything past this and the rotation starts to feel like a slideshow
 *  rather than a hero. The admin UI hides the Add button once the count
 *  hits this number, and createHeroSlide() also enforces it as a guard. */
export const MAX_HERO_SLIDES = 6;

/** Public list — used by the homepage. Only returns active rows, sorted. */
export async function listActiveHeroSlides(): Promise<HeroSlide[]> {
  const { data, error } = await supabase
    .from("mtm_hero_slides")
    .select("*")
    .eq("active", true)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) return [];
  return (data ?? []) as HeroSlide[];
}

/** Admin list — everything, active first then inactive, in position order. */
export async function listAllHeroSlides(): Promise<HeroSlide[]> {
  const { data, error } = await supabase
    .from("mtm_hero_slides")
    .select("*")
    .order("active", { ascending: false })
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as HeroSlide[];
}

/** Upload a hero image to the editorial bucket, then insert a row. The
 *  new slide goes to the bottom of the list. Blocked once the list has
 *  reached MAX_HERO_SLIDES; UI hides the Add button before this fires,
 *  but the guard keeps the constraint honest in case the button is
 *  reached by other means. */
export async function createHeroSlide(file: File, alt: string): Promise<{ data: HeroSlide | null; error: string | null }> {
  try {
    const { count } = await supabase
      .from("mtm_hero_slides")
      .select("id", { count: "exact", head: true });
    if ((count ?? 0) >= MAX_HERO_SLIDES) {
      return { data: null, error: `You can have up to ${MAX_HERO_SLIDES} hero slides. Remove one before adding another.` };
    }
    const image_url = await uploadEditorialImage(file);
    // Find the highest position + 1 so new slides land at the end.
    const { data: tail } = await supabase
      .from("mtm_hero_slides")
      .select("position")
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextPosition = (tail?.position ?? -1) + 1;
    const { data, error } = await supabase
      .from("mtm_hero_slides")
      .insert({
        image_url,
        alt: alt.trim() || null,
        position: nextPosition,
        active: true,
      })
      .select()
      .single();
    if (error) return { data: null, error: error.message };
    return { data: data as HeroSlide, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : "Upload failed." };
  }
}

export async function updateHeroSlide(id: string, patch: Partial<Pick<HeroSlide, "alt" | "active" | "position">>): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("mtm_hero_slides")
    .update(patch)
    .eq("id", id);
  return { error: error?.message ?? null };
}

export async function deleteHeroSlide(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("mtm_hero_slides")
    .delete()
    .eq("id", id);
  return { error: error?.message ?? null };
}

/** Reorder by swapping positions between two slides. Simple two-row swap;
 *  we don't normalise position numbers because the homepage just sorts. */
export async function swapHeroSlidePositions(a: HeroSlide, b: HeroSlide): Promise<{ error: string | null }> {
  const { error: e1 } = await supabase.from("mtm_hero_slides").update({ position: b.position }).eq("id", a.id);
  if (e1) return { error: e1.message };
  const { error: e2 } = await supabase.from("mtm_hero_slides").update({ position: a.position }).eq("id", b.id);
  return { error: e2?.message ?? null };
}
