"use server";

import { getCurrentUser } from "@/lib/auth";
import { getGeocoder, type GeocodeResult } from "@/lib/geocoding";

// Look up coordinates for a free-text place query (e.g. "Kyoto, Japan").
// Auth-gated so it isn't an open geocoding proxy; returns null on no match or
// provider error so the caller can fall back to manual entry.
export async function geocodeAction(
  query: string,
): Promise<GeocodeResult | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const q = query.trim();
  if (q.length < 2) return null;
  try {
    return await getGeocoder().geocode(q);
  } catch {
    return null;
  }
}
