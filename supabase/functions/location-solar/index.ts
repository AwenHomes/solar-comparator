// Location-aware solar production model proxy.
//
// Takes { zip?, state?, lat?, long?, systemSizeKw, tilt?, azimuth?, losses? }
// and returns { lat, long, city, state, annualKwh, monthlyKwh[12], estimate? }.
//
// - When lat/long are missing, falls back to Nominatim (free, OSM) for ZIP
//   geocoding. Results are cached in-memory per edge instance for 24 hours.
// - Calls NREL PVWatts v8 (developer.nrel.gov, free tier) for production
//   modeling.
// - If the upstream fails, returns { estimate: true } with a crude
//   peakSunHours × 365 × 0.77 × systemSizeKw fallback. The browser caller
//   softens the audit thresholds when estimate=true.
//
// Secrets required: NREL_API_KEY (grab at https://developer.nrel.gov/signup).
// Nominatim is unauthenticated but requires a real User-Agent.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// Per-IP rate limiter: 30 req/hour. Production models one call per proposal,
// so 30 covers ~10 full sessions/hour/IP which is plenty without being abusable.
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function checkRate(ip: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(ip);
  if (!bucket || bucket.resetAt < now) {
    rateBuckets.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (bucket.count >= RATE_LIMIT_MAX) return false;
  bucket.count += 1;
  return true;
}

// In-memory geocode cache (24 hours). Cold-start resets — that's fine.
const GEO_CACHE_TTL = 24 * 60 * 60 * 1000;
const geoCache = new Map<string, { value: GeoHit; expiresAt: number }>();

interface GeoHit {
  lat: number;
  long: number;
  city: string | null;
  state: string | null;
}

async function geocodeZip(zip: string): Promise<GeoHit | null> {
  const key = `zip:${zip}`;
  const cached = geoCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("postalcode", zip);
    url.searchParams.set("country", "United States");
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");
    url.searchParams.set("addressdetails", "1");

    const resp = await fetch(url.toString(), {
      headers: {
        // Nominatim ToS requires a real, contactable User-Agent.
        "User-Agent": "AwenEnergy/1.0 (privacy@awenenergy.com)",
        Accept: "application/json",
      },
    });
    if (!resp.ok) return null;
    const arr = (await resp.json()) as Array<{
      lat: string;
      lon: string;
      address?: { city?: string; town?: string; village?: string; state?: string; "ISO3166-2-lvl4"?: string };
    }>;
    if (!arr.length) return null;
    const hit = arr[0];
    const addr = hit.address ?? {};
    const stateCode = addr["ISO3166-2-lvl4"]?.replace("US-", "") ?? null;
    const city = addr.city ?? addr.town ?? addr.village ?? null;
    const value: GeoHit = {
      lat: parseFloat(hit.lat),
      long: parseFloat(hit.lon),
      city,
      state: stateCode,
    };
    geoCache.set(key, { value, expiresAt: Date.now() + GEO_CACHE_TTL });
    return value;
  } catch (e) {
    console.warn("nominatim geocode failed", e);
    return null;
  }
}

// Coarse state-capital fallback so we always return SOMETHING when Nominatim
// is unreachable. Keep this table in sync with src/data/zipCentroids.js.
const STATE_CENTROIDS: Record<string, { lat: number; long: number; peakSunHours: number }> = {
  AL: { lat: 32.806, long: -86.791, peakSunHours: 4.7 },
  AK: { lat: 63.588, long: -154.493, peakSunHours: 3.3 },
  AZ: { lat: 33.729, long: -111.431, peakSunHours: 6.5 },
  AR: { lat: 34.970, long: -92.373, peakSunHours: 5.0 },
  CA: { lat: 36.116, long: -119.682, peakSunHours: 5.6 },
  CO: { lat: 39.059, long: -105.311, peakSunHours: 5.5 },
  CT: { lat: 41.597, long: -72.755, peakSunHours: 4.5 },
  DE: { lat: 39.318, long: -75.507, peakSunHours: 4.6 },
  FL: { lat: 27.766, long: -81.686, peakSunHours: 5.3 },
  GA: { lat: 33.040, long: -83.643, peakSunHours: 5.0 },
  HI: { lat: 21.094, long: -157.498, peakSunHours: 5.5 },
  ID: { lat: 44.240, long: -114.479, peakSunHours: 5.1 },
  IL: { lat: 40.349, long: -88.986, peakSunHours: 4.2 },
  IN: { lat: 39.849, long: -86.258, peakSunHours: 4.5 },
  IA: { lat: 42.011, long: -93.210, peakSunHours: 4.6 },
  KS: { lat: 38.526, long: -96.726, peakSunHours: 5.0 },
  KY: { lat: 37.668, long: -84.670, peakSunHours: 4.5 },
  LA: { lat: 31.169, long: -91.867, peakSunHours: 5.0 },
  ME: { lat: 44.693, long: -69.381, peakSunHours: 4.2 },
  MD: { lat: 39.063, long: -76.802, peakSunHours: 4.5 },
  MA: { lat: 42.231, long: -71.530, peakSunHours: 4.3 },
  MI: { lat: 43.326, long: -84.536, peakSunHours: 4.2 },
  MN: { lat: 45.694, long: -93.900, peakSunHours: 4.4 },
  MS: { lat: 32.741, long: -89.679, peakSunHours: 5.0 },
  MO: { lat: 38.456, long: -92.288, peakSunHours: 4.8 },
  MT: { lat: 46.921, long: -110.454, peakSunHours: 4.6 },
  NE: { lat: 41.125, long: -98.268, peakSunHours: 4.8 },
  NV: { lat: 38.313, long: -117.055, peakSunHours: 6.2 },
  NH: { lat: 43.452, long: -71.563, peakSunHours: 4.3 },
  NJ: { lat: 40.298, long: -74.521, peakSunHours: 4.4 },
  NM: { lat: 34.840, long: -106.248, peakSunHours: 5.8 },
  NY: { lat: 42.165, long: -74.948, peakSunHours: 4.3 },
  NC: { lat: 35.630, long: -79.806, peakSunHours: 5.0 },
  ND: { lat: 47.528, long: -99.784, peakSunHours: 4.5 },
  OH: { lat: 40.388, long: -82.764, peakSunHours: 4.3 },
  OK: { lat: 35.565, long: -96.928, peakSunHours: 5.2 },
  OR: { lat: 44.572, long: -122.070, peakSunHours: 4.0 },
  PA: { lat: 40.590, long: -77.209, peakSunHours: 4.3 },
  RI: { lat: 41.680, long: -71.511, peakSunHours: 4.3 },
  SC: { lat: 33.856, long: -80.945, peakSunHours: 5.0 },
  SD: { lat: 44.299, long: -99.439, peakSunHours: 4.6 },
  TN: { lat: 35.747, long: -86.692, peakSunHours: 4.8 },
  TX: { lat: 31.054, long: -97.563, peakSunHours: 5.3 },
  UT: { lat: 40.150, long: -111.862, peakSunHours: 5.5 },
  VT: { lat: 44.045, long: -72.710, peakSunHours: 4.2 },
  VA: { lat: 37.769, long: -78.170, peakSunHours: 4.7 },
  WA: { lat: 47.400, long: -121.490, peakSunHours: 3.8 },
  WV: { lat: 38.491, long: -80.954, peakSunHours: 4.3 },
  WI: { lat: 44.268, long: -89.616, peakSunHours: 4.3 },
  WY: { lat: 42.756, long: -107.302, peakSunHours: 5.2 },
  DC: { lat: 38.907, long: -77.037, peakSunHours: 4.4 },
};

function fallbackProduction(state: string | null, systemSizeKw: number): number {
  const sd = state ? STATE_CENTROIDS[state] : null;
  const peakSunHours = sd?.peakSunHours ?? 4.5;
  return Math.round(peakSunHours * 365 * 0.77 * systemSizeKw);
}

interface PvWattsResponse {
  outputs?: {
    ac_annual?: number;
    ac_monthly?: number[];
  };
  errors?: string[];
}

async function pvwatts(params: {
  lat: number;
  long: number;
  systemSizeKw: number;
  tilt: number;
  azimuth: number;
  losses: number;
  apiKey: string;
}): Promise<{ annualKwh: number; monthlyKwh: number[] } | null> {
  const url = new URL("https://developer.nrel.gov/api/pvwatts/v8.json");
  url.searchParams.set("api_key", params.apiKey);
  url.searchParams.set("lat", String(params.lat));
  url.searchParams.set("lon", String(params.long));
  url.searchParams.set("system_capacity", String(params.systemSizeKw));
  url.searchParams.set("azimuth", String(params.azimuth));
  url.searchParams.set("tilt", String(params.tilt));
  url.searchParams.set("array_type", "1"); // fixed roof-mount
  url.searchParams.set("module_type", "1"); // standard crystalline silicon
  url.searchParams.set("losses", String(params.losses));
  url.searchParams.set("dataset", "nsrdb");
  url.searchParams.set("timeframe", "monthly");

  try {
    const resp = await fetch(url.toString(), { method: "GET" });
    if (!resp.ok) {
      console.warn("pvwatts non-OK", resp.status);
      return null;
    }
    const data = (await resp.json()) as PvWattsResponse;
    const annual = data.outputs?.ac_annual;
    const monthly = data.outputs?.ac_monthly;
    if (typeof annual !== "number" || !Array.isArray(monthly) || monthly.length !== 12) {
      console.warn("pvwatts unexpected shape", JSON.stringify(data.errors));
      return null;
    }
    return { annualKwh: Math.round(annual), monthlyKwh: monthly.map((v) => Math.round(v)) };
  } catch (e) {
    console.warn("pvwatts request failed", e);
    return null;
  }
}

function clampLatLong(lat: number, long: number): boolean {
  // Continental US + AK + HI + PR roughly.
  return lat >= 15 && lat <= 72 && long >= -170 && long <= -60;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  const apiKey = Deno.env.get("NREL_API_KEY");
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkRate(ip)) return json(429, { error: "Rate limit exceeded" });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return json(400, { error: "Invalid JSON" });
  }

  const systemSizeKw = typeof body.systemSizeKw === "number" ? body.systemSizeKw : parseFloat(String(body.systemSizeKw ?? ""));
  if (!Number.isFinite(systemSizeKw) || systemSizeKw <= 0 || systemSizeKw > 100) {
    return json(400, { error: "systemSizeKw must be a positive number ≤ 100" });
  }

  const zip = typeof body.zip === "string" ? body.zip.replace(/\D/g, "").slice(0, 5) : "";
  const state = typeof body.state === "string" ? body.state.toUpperCase().slice(0, 2) : "";
  let lat = typeof body.lat === "number" ? body.lat : parseFloat(String(body.lat ?? ""));
  let long = typeof body.long === "number" ? body.long : parseFloat(String(body.long ?? ""));
  const azimuth = Number.isFinite(body.azimuth as number) ? (body.azimuth as number) : 180;
  const losses = Number.isFinite(body.losses as number) ? (body.losses as number) : 14;

  let city: string | null = null;
  let resolvedState: string | null = state || null;

  // Step 1: resolve lat/long if missing.
  if (!Number.isFinite(lat) || !Number.isFinite(long)) {
    if (zip.length === 5) {
      const hit = await geocodeZip(zip);
      if (hit) {
        lat = hit.lat;
        long = hit.long;
        city = hit.city;
        resolvedState = hit.state || resolvedState;
      }
    }
  }
  if ((!Number.isFinite(lat) || !Number.isFinite(long)) && state && STATE_CENTROIDS[state]) {
    lat = STATE_CENTROIDS[state].lat;
    long = STATE_CENTROIDS[state].long;
  }

  if (!Number.isFinite(lat) || !Number.isFinite(long) || !clampLatLong(lat, long)) {
    return json(400, { error: "Could not resolve a valid US latitude/longitude" });
  }

  const tilt = Number.isFinite(body.tilt as number) ? (body.tilt as number) : Math.abs(lat);

  // Step 2: PVWatts, with fallback.
  if (apiKey) {
    const result = await pvwatts({ lat, long, systemSizeKw, tilt, azimuth, losses, apiKey });
    if (result) {
      return json(200, {
        lat,
        long,
        city,
        state: resolvedState,
        tilt,
        azimuth,
        annualKwh: result.annualKwh,
        monthlyKwh: result.monthlyKwh,
        source: "pvwatts",
      });
    }
  } else {
    console.warn("NREL_API_KEY not configured — using state-lookup fallback");
  }

  const annualKwh = fallbackProduction(resolvedState, systemSizeKw);
  return json(200, {
    lat,
    long,
    city,
    state: resolvedState,
    tilt,
    azimuth,
    annualKwh,
    monthlyKwh: null,
    estimate: true,
    source: apiKey ? "state_lookup_after_pvwatts_fail" : "state_lookup",
  });
});
