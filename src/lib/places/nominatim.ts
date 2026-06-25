import type { SpotCategory } from "@/lib/validation";
import type { PlaceResult, PlacesProvider } from "./types";
import { applyKindToQuery } from "./kinds";

// OpenStreetMap Nominatim — free, no API key. Usage policy requires a
// descriptive User-Agent (and politeness: ≤1 req/s, caching). Calls run
// server-side so the User-Agent is controlled and never reaches the browser.
const BASE = process.env.NOMINATIM_BASE_URL ?? "https://nominatim.openstreetmap.org";
const CONTACT = process.env.PLACES_CONTACT_EMAIL;
const USER_AGENT = `Travelplaning/1.0 (travel planner${CONTACT ? `; ${CONTACT}` : ""})`;

// Maps an OSM `type` (and broad `category`) to our spot categories.
const TYPE_TABLE: Record<string, SpotCategory> = {
  museum: "museum",
  gallery: "museum",
  artwork: "sightseeing",
  attraction: "sightseeing",
  viewpoint: "sightseeing",
  monument: "sightseeing",
  memorial: "sightseeing",
  castle: "sightseeing",
  ruins: "sightseeing",
  place_of_worship: "sightseeing",
  restaurant: "restaurant",
  fast_food: "restaurant",
  food_court: "restaurant",
  cafe: "cafe",
  bar: "bar",
  pub: "bar",
  biergarten: "bar",
  nightclub: "nightlife",
  park: "nature",
  nature_reserve: "nature",
  peak: "nature",
  beach: "nature",
  forest: "nature",
  water: "nature",
  garden: "nature",
  mall: "shopping",
  supermarket: "shopping",
  department_store: "shopping",
  marketplace: "shopping",
  zoo: "family_friendly",
  theme_park: "family_friendly",
  aquarium: "family_friendly",
};

export function mapOsmCategory(
  category?: string,
  type?: string,
): SpotCategory | undefined {
  const t = (type ?? "").toLowerCase();
  if (TYPE_TABLE[t]) return TYPE_TABLE[t];
  const c = (category ?? "").toLowerCase();
  if (c === "tourism") return "sightseeing";
  if (c === "natural" || c === "leisure") return "nature";
  if (c === "shop") return "shopping";
  return undefined;
}

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

export const nominatimProvider: PlacesProvider = {
  name: "nominatim",
  async search(query, opts) {
    if (!query.trim()) return [];
    // A chosen kind biases the geocoder via a keyword (e.g. "restaurant <query>").
    const q = applyKindToQuery(query, opts?.kind);
    const params = new URLSearchParams({
      q,
      format: "jsonv2",
      addressdetails: "0",
      limit: String(opts?.limit ?? 8),
    });
    if (opts?.lang) params.set("accept-language", opts.lang);

    const res = await fetch(`${BASE}/search?${params.toString()}`, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      // Cache identical queries for a day to respect the usage policy.
      next: { revalidate: 86400 },
    });
    if (!res.ok) throw new Error(`Nominatim request failed (${res.status})`);
    return parseNominatimResults(await res.json());
  },
};
