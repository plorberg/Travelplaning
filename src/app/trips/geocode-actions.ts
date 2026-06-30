"use server";

import { getCurrentUser } from "@/lib/auth";
import { geocodeOne } from "@/lib/places/nominatim";

// Geocodes a place to coordinates (OpenStreetMap/Nominatim). Tries the given
// candidate queries in order (e.g. address-only, then with name) and returns
// the first hit, so a precise address wins but there's a fallback. Auth-gated
// so it isn't an open geocoding proxy; runs server-side for the Nominatim
// usage policy (descriptive User-Agent).
export async function geocodeAddressAction(
  queries: string[],
): Promise<{ lat: number; lng: number } | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const seen = new Set<string>();
  for (const raw of queries.slice(0, 5)) {
    const q = (raw ?? "").trim().slice(0, 300);
    if (!q || seen.has(q.toLowerCase())) continue;
    seen.add(q.toLowerCase());
    const hit = await geocodeOne(q, "de");
    if (hit) return hit;
  }
  return null;
}
