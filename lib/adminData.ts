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
