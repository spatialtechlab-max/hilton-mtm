import { supabase } from "./supabase";
import { getSeedConfig } from "./customizer";

export type DbStep = {
  slug: string;
  title: string;
  eyebrow: string | null;
  subtitle: string | null;
  description: string | null;
  kind: string;
  applies_to: string[];
  tier: string | null;
  requires_slug: string | null;
  requires_value: string | null;
  sort_order: number;
  active: boolean;
};

export type DbOption = {
  id: string;
  step_slug: string;
  value: string;
  label: string;
  note: string | null;
  color: string | null;
  image_url: string | null;
  surcharge: number;
  sort_order: number;
  active: boolean;
};

export async function fetchSteps(): Promise<DbStep[]> {
  const { data, error } = await supabase.from("mtm_steps").select("*").order("sort_order");
  if (error) throw error;
  return (data ?? []) as DbStep[];
}

export async function fetchOptions(): Promise<DbOption[]> {
  const { data, error } = await supabase.from("mtm_options").select("*").order("sort_order");
  if (error) throw error;
  return (data ?? []) as DbOption[];
}

export type OptionPatch = Partial<Pick<DbOption,
  "label" | "value" | "note" | "color" | "image_url" | "surcharge" | "sort_order" | "active"
>>;

export async function updateOption(id: string, patch: OptionPatch): Promise<void> {
  const { error } = await supabase
    .from("mtm_options")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export type StepPatch = Partial<Pick<DbStep, "tier" | "active" | "title" | "applies_to">>;

export async function updateStep(slug: string, patch: StepPatch): Promise<void> {
  const { error } = await supabase
    .from("mtm_steps")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("slug", slug);
  if (error) throw error;
}

/** Create a brand-new step (module). The atelier names it, picks the kind
 *  + tier + which garments it shows for; options are added afterward via
 *  insertOption. */
export async function insertStep(row: {
  slug: string;
  title: string;
  kind: string;
  tier: string | null;
  applies_to: string[];
  sort_order?: number;
}): Promise<DbStep> {
  const { data, error } = await supabase
    .from("mtm_steps")
    .insert({
      slug: row.slug,
      title: row.title,
      eyebrow: null,
      subtitle: null,
      description: null,
      kind: row.kind,
      applies_to: row.applies_to,
      tier: row.tier,
      requires_slug: null,
      requires_value: null,
      sort_order: row.sort_order ?? 999,
      active: true,
    })
    .select()
    .single();
  if (error) throw error;
  return data as DbStep;
}

/** Delete a step and (cascade) its options. Used to remove a module the
 *  atelier created. */
export async function deleteStep(slug: string): Promise<void> {
  await supabase.from("mtm_options").delete().eq("step_slug", slug);
  const { error } = await supabase.from("mtm_steps").delete().eq("slug", slug);
  if (error) throw error;
}

/* ── Per-garment step order ──────────────────────────────────────────
   The customizer sequence ("what comes after what") is controlled per
   garment, stored in mtm_settings under `step.order.<garment>` as a JSON
   array of step slugs. Per-garment (not the global mtm_steps.sort_order)
   so reordering trousers never reshuffles the suit flow. Garments with
   no saved order fall back to sort_order. No migration — reuses the
   existing key/value settings table. */

export async function fetchStepOrders(): Promise<Record<string, string[]>> {
  const { data, error } = await supabase
    .from("mtm_settings")
    .select("key,value")
    .like("key", "step.order.%");
  if (error || !data) return {};
  const out: Record<string, string[]> = {};
  for (const row of data as { key: string; value: string }[]) {
    const garment = row.key.slice("step.order.".length);
    try {
      const arr = JSON.parse(row.value);
      if (Array.isArray(arr)) out[garment] = arr.filter((x) => typeof x === "string");
    } catch { /* ignore malformed */ }
  }
  return out;
}

export async function saveStepOrder(garment: string, slugs: string[]): Promise<void> {
  const { error } = await supabase
    .from("mtm_settings")
    .upsert(
      { key: `step.order.${garment}`, value: JSON.stringify(slugs), updated_at: new Date().toISOString() },
      { onConflict: "key" },
    );
  if (error) throw error;
}

/** Order `steps` by a saved per-garment slug list. Steps not in the list
 *  (newly added) keep their incoming relative order at the end. Pure +
 *  stable so it's shared by the admin preview and the customizer. */
export function applyStepOrder<T extends { slug: string }>(steps: T[], order: string[] | null | undefined): T[] {
  if (!order || order.length === 0) return steps;
  const pos = new Map(order.map((slug, i) => [slug, i]));
  return steps
    .map((s, i) => ({ s, i }))
    .sort((a, b) => {
      const pa = pos.get(a.s.slug) ?? Number.MAX_SAFE_INTEGER;
      const pb = pos.get(b.s.slug) ?? Number.MAX_SAFE_INTEGER;
      return pa === pb ? a.i - b.i : pa - pb;
    })
    .map(({ s }) => s);
}

export async function insertOption(row: {
  step_slug: string; value: string; label: string;
  note?: string | null; color?: string | null; image_url?: string | null;
  surcharge?: number; sort_order?: number;
}): Promise<DbOption> {
  const { data, error } = await supabase
    .from("mtm_options")
    .insert({ active: true, surcharge: 0, sort_order: 0, ...row })
    .select()
    .single();
  if (error) throw error;
  return data as DbOption;
}

export async function deleteOption(id: string): Promise<void> {
  const { error } = await supabase.from("mtm_options").delete().eq("id", id);
  if (error) throw error;
}

/** Upload an option image to the "mtm-media" Storage bucket; returns its public URL. */
export async function uploadOptionImage(file: File): Promise<string> {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `options/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("mtm-media").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  return supabase.storage.from("mtm-media").getPublicUrl(path).data.publicUrl;
}

/**
 * Populate the database from the static config. Non-destructive: existing rows
 * (and any surcharges set by the admin) are kept; only missing rows are added.
 */
export async function seedFromConfig(): Promise<{ steps: number; options: number }> {
  const cfg = getSeedConfig();

  const stepRows = cfg.map((s) => ({
    slug: s.slug,
    title: s.title,
    eyebrow: s.eyebrow,
    subtitle: s.subtitle,
    description: s.description,
    kind: s.kind,
    applies_to: s.appliesTo,
    tier: s.tier,
    requires_slug: s.requiresSlug,
    requires_value: s.requiresValue,
    sort_order: s.sortOrder,
    active: true,
  }));
  const { error: se } = await supabase
    .from("mtm_steps")
    .upsert(stepRows, { onConflict: "slug", ignoreDuplicates: true });
  if (se) throw se;

  const optRows = cfg.flatMap((s) =>
    s.options.map((o) => ({
      step_slug: s.slug,
      value: o.value,
      label: o.label,
      note: o.note,
      color: o.color,
      image_url: o.image,
      surcharge: 0,
      sort_order: o.sortOrder,
      active: true,
    })),
  );
  const { error: oe } = await supabase
    .from("mtm_options")
    .upsert(optRows, { onConflict: "step_slug,value", ignoreDuplicates: true });
  if (oe) throw oe;

  return { steps: stepRows.length, options: optRows.length };
}
