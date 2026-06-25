/**
 * Server-side reader for mtm_settings. Used by server components (the
 * library PDP, etc.) to render atelier overrides during SSR without
 * a flash of the source default. RLS allows public read on the
 * settings table, so no auth is needed.
 */
import { defaultFor } from "./settingsRegistry";
import { parseVatRate } from "./checkoutFees";

type SettingRow = { key: string; value: string };

const REVALIDATE_SECS = 60;

export async function fetchSettingsServer(): Promise<Record<string, string>> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return {};
  try {
    const res = await fetch(
      `${url}/rest/v1/mtm_settings?select=key,value`,
      {
        headers: { apikey: anon, Authorization: `Bearer ${anon}` },
        next: { revalidate: REVALIDATE_SECS },
      },
    );
    if (!res.ok) return {};
    const rows = (await res.json()) as SettingRow[];
    const map: Record<string, string> = {};
    for (const r of rows) map[r.key] = r.value;
    return map;
  } catch {
    return {};
  }
}

/** Resolve a setting: override if present, otherwise the registry default. */
export function resolveSetting(
  map: Record<string, string>,
  key: string,
): string {
  return map[key] ?? defaultFor(key);
}

/** The admin-set VAT rate as a fraction (e.g. 0.10), for server routes
 *  (the payment session, the confirmation email, Sebastian's dossier). */
export async function fetchVatRate(): Promise<number> {
  const map = await fetchSettingsServer();
  return parseVatRate(map["vat.rate"]);
}
