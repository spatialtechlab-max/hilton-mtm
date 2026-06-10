/**
 * Lightweight Open-Meteo wrapper. Geocodes the visitor's profile city +
 * country to lat/lon, then pulls current weather + 7-day outlook and
 * formats it as a compact prompt block for Sebastian. Open-Meteo needs
 * no API key, is free for non-commercial use, and has its own geocoding
 * endpoint so we never have to ship coordinates from the client.
 *
 * Two upstream calls are made per request, both ISR-cached:
 *   geocoding   – 24h (city locations don't move)
 *   forecast    –  1h (weather is stable enough at that resolution)
 */

const GEOCODE_TTL = 60 * 60 * 24;     // 24h
const FORECAST_TTL = 60 * 60;          // 1h

type GeocodeResult = {
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
};

export type ClimateBrief = {
  city: string;
  country: string;
  currentC: number;
  humidity: number;
  weatherWord: string;
  weekHighC: number;
  weekLowC: number;
};

/** Translate Open-Meteo WMO weather codes into a short, model-friendly word.
 *  https://open-meteo.com/en/docs#weathervariables */
function weatherWord(code: number): string {
  if (code === 0) return "clear";
  if (code === 1) return "mostly clear";
  if (code === 2) return "partly cloudy";
  if (code === 3) return "overcast";
  if (code >= 45 && code <= 48) return "foggy";
  if (code >= 51 && code <= 57) return "drizzling";
  if (code >= 61 && code <= 67) return "rainy";
  if (code >= 71 && code <= 77) return "snowy";
  if (code >= 80 && code <= 82) return "rain showers";
  if (code >= 85 && code <= 86) return "snow showers";
  if (code >= 95) return "thundery";
  return "mixed";
}

async function geocode(city: string, country?: string): Promise<GeocodeResult | null> {
  if (!city) return null;
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=5&language=en&format=json`;
    const res = await fetch(url, { next: { revalidate: GEOCODE_TTL } });
    if (!res.ok) return null;
    const data = await res.json();
    const results: GeocodeResult[] = Array.isArray(data?.results) ? data.results : [];
    if (results.length === 0) return null;
    if (country) {
      // Prefer a hit whose country actually matches the profile —
      // disambiguates "Manchester" UK vs USA etc.
      const ct = country.trim().toLowerCase();
      const match = results.find((r) => r.country?.toLowerCase() === ct);
      if (match) return match;
    }
    return results[0];
  } catch {
    return null;
  }
}

async function fetchForecast(lat: number, lon: number): Promise<{
  currentC: number;
  humidity: number;
  weatherWord: string;
  weekHighC: number;
  weekLowC: number;
} | null> {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?` +
      `latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,relative_humidity_2m,weather_code` +
      `&daily=temperature_2m_max,temperature_2m_min` +
      `&forecast_days=7&timezone=auto`;
    const res = await fetch(url, { next: { revalidate: FORECAST_TTL } });
    if (!res.ok) return null;
    const data = await res.json();
    const cur = data?.current ?? {};
    const daily = data?.daily ?? {};
    const highs: number[] = Array.isArray(daily.temperature_2m_max) ? daily.temperature_2m_max : [];
    const lows: number[] = Array.isArray(daily.temperature_2m_min) ? daily.temperature_2m_min : [];
    if (typeof cur.temperature_2m !== "number" || highs.length === 0 || lows.length === 0) {
      return null;
    }
    return {
      currentC: Math.round(cur.temperature_2m),
      humidity: Math.round(cur.relative_humidity_2m ?? 0),
      weatherWord: weatherWord(typeof cur.weather_code === "number" ? cur.weather_code : 0),
      weekHighC: Math.round(Math.max(...highs)),
      weekLowC: Math.round(Math.min(...lows)),
    };
  } catch {
    return null;
  }
}

/** Top-level helper. Returns null when either upstream call fails so the
 *  caller can decide whether to ship a "climate unavailable" fallback. */
export async function getClimateBrief(city: string, country?: string): Promise<ClimateBrief | null> {
  const geo = await geocode(city, country);
  if (!geo) return null;
  const f = await fetchForecast(geo.latitude, geo.longitude);
  if (!f) return null;
  return {
    city: geo.name,
    country: geo.country,
    ...f,
  };
}

/** Format the brief as a compact prompt block. Keeps numbers terse and
 *  spells out the implication so the model latches onto cloth weight,
 *  not raw degrees. */
export function climateBlockForPrompt(brief: ClimateBrief, mode: "user" | "atelier"): string {
  const headline =
    mode === "user"
      ? `VISITOR BASE CLIMATE (their profile city — use as their default unless they name a different destination):`
      : `ATELIER BASE CLIMATE (visitor not signed in — defaulting to the Hilton MTM atelier in Manama):`;
  return [
    headline,
    `City: ${brief.city}, ${brief.country}`,
    `Right now: ${brief.currentC}°C, ${brief.humidity}% humidity, ${brief.weatherWord}`,
    `Coming week: highs around ${brief.weekHighC}°C, lows around ${brief.weekLowC}°C`,
  ].join("\n");
}
