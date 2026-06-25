import type { PlaceResult, PlacesProvider } from "./types";
import { mapOsmCategory } from "./osm-tags";
import { searchOverpass } from "./overpass";

// OpenStreetMap Nominatim — free, no API key. Usage policy requires a
// descriptive User-Agent (and politeness: ≤1 req/s, caching). Calls run
// server-side so the User-Agent is controlled and never reaches the browser.
//
// Nominatim is a geocoder (finds named places), so it's used for free-text
// "search by name". For category discovery ("restaurants near X") a kind is
// given: we geocode the place to a point, then hand off to the Overpass POI
// search.
const BASE = process.env.NOMINATIM_BASE_URL ?? "https://nominatim.openstreetmap.org";
const CONTACT = process.env.PLACES_CONTACT_EMAIL;
const USER_AGENT = `Travelplaning/1.0 (travel planner${CONTACT ? `; ${CONTACT}` : ""})`;

type NominatimRow = {
  osm_type?: string;
  osm_id?: number;
  lat?: string;
  lon?: string;
  name?: string;
  display_name?: string;
  category?: string; // jsonv2
  class?: string; // legacy json
  type?: string;
};

/** Pure parser for a Nominatim jsonv2 response (separated so it's testable). */
export function parseNominatimResults(rows: unknown): PlaceResult[] {
  if (!Array.isArray(rows)) return [];
  const out: PlaceResult[] = [];
  for (const r of rows as NominatimRow[]) {
    const lat = Number(r.lat);
    const lng = Number(r.lon);
    if (Number.isNaN(lat) || Number.isNaN(lng)) continue;
    const display = (r.display_name ?? "").trim();
    const name = (r.name && r.name.trim()) || display.split(",")[0].trim();
    if (!name) continue;
    out.push({
      id: `${r.osm_type ?? "n"}/${r.osm_id ?? `${lat},${lng}`}`,
      name,
      address: display,
      lat,
      lng,
      category: mapOsmCategory(r.category ?? r.class, r.type),
      source: "OpenStreetMap",
    });
  }
  return out;
}

async function nominatimSearch(
  query: string,
  opts?: { limit?: number; lang?: string },
): Promise<PlaceResult[]> {
  const params = new URLSearchParams({
    q: query,
    format: "jsonv2",
    addressdetails: "0",
    limit: String(opts?.limit ?? 12),
  });
  if (opts?.lang) params.set("accept-language", opts.lang);

  const res = await fetch(`${BASE}/search?${params.toString()}`, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    next: { revalidate: 86400 },
  });
  if (!res.ok) throw new Error(`Nominatim request failed (${res.status})`);
  return parseNominatimResults(await res.json());
}

/** Geocodes a place name to its first coordinate (for the Overpass handoff). */
export async function geocodeOne(
  query: string,
  lang?: string,
): Promise<{ lat: number; lng: number } | null> {
  const results = await nominatimSearch(query, { limit: 1, lang });
  const first = results[0];
  return first && first.lat != null && first.lng != null
    ? { lat: first.lat, lng: first.lng }
    : null;
}

export const nominatimProvider: PlacesProvider = {
  name: "nominatim",
  async search(query, opts) {
    const q = query.trim();
    if (!q) return [];

    // With a kind: geocode the destination, then POI-search via Overpass.
    if (opts?.kind) {
      const center = await geocodeOne(q, opts.lang);
      if (!center) return [];
      return searchOverpass(center, opts.kind, opts.limit ?? 25);
    }

    // Otherwise a plain geocoder "search by name".
    return nominatimSearch(q, opts);
  },
};
