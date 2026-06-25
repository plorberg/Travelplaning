import type { PlaceKind, PlaceResult } from "./types";
import { PLACE_KINDS } from "./kinds";
import { mapOsmCategory } from "./osm-tags";

// OSM Overpass API — real POI search by category within a radius of a point.
// Used for "find restaurants / sights / … near <destination>" (Nominatim is a
// geocoder and can't do this). Free, no key; needs a descriptive User-Agent.
const ENDPOINT = process.env.OVERPASS_URL ?? "https://overpass-api.de/api/interpreter";
const CONTACT = process.env.PLACES_CONTACT_EMAIL;
const USER_AGENT = `Travelplaning/1.0 (travel planner${CONTACT ? `; ${CONTACT}` : ""})`;

const RADIUS_M = 8000;

export function buildOverpassQuery(
  lat: number,
  lng: number,
  kind: PlaceKind,
  radius = RADIUS_M,
): string {
  const selectors = PLACE_KINDS[kind].overpass
    .map((s) => `${s}(around:${radius},${lat},${lng});`)
    .join("");
  return `[out:json][timeout:25];(${selectors});out center 60;`;
}

type OverpassElement = {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

// The first present tag (in priority order) decides the category.
const TAG_KEYS = ["tourism", "historic", "amenity", "leisure", "natural", "shop"];

/** Pure parser for an Overpass JSON response (separated so it's testable). */
export function parseOverpassElements(json: unknown, limit = 25): PlaceResult[] {
  const elements = (json as { elements?: OverpassElement[] })?.elements ?? [];
  const out: PlaceResult[] = [];
  for (const el of elements) {
    const tags = el.tags ?? {};
    const name = (tags.name ?? "").trim();
    if (!name) continue;
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    if (lat == null || lng == null) continue;

    const key = TAG_KEYS.find((k) => tags[k]);
    const category = mapOsmCategory(key, key ? tags[key] : undefined);
    const address =
      [tags["addr:street"], tags["addr:housenumber"]].filter(Boolean).join(" ") ||
      tags["addr:full"] ||
      "";

    out.push({
      id: `${el.type}/${el.id}`,
      name,
      address,
      lat,
      lng,
      category,
      note: tags.description || undefined,
      source: "OpenStreetMap",
    });
    if (out.length >= limit) break;
  }
  return out;
}

export async function searchOverpass(
  center: { lat: number; lng: number },
  kind: PlaceKind,
  limit = 25,
): Promise<PlaceResult[]> {
  const query = buildOverpassQuery(center.lat, center.lng, kind);
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "User-Agent": USER_AGENT,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({ data: query }),
    next: { revalidate: 86400 },
  });
  if (!res.ok) throw new Error(`Overpass request failed (${res.status})`);
  return parseOverpassElements(await res.json(), limit);
}
