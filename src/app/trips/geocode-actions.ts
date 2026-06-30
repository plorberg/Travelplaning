"use server";

import { getCurrentUser } from "@/lib/auth";
import { geocodeOne } from "@/lib/places/nominatim";

// Geocodes a free-text address/place to coordinates (OpenStreetMap/Nominatim).
// Auth-gated so it isn't an open geocoding proxy; runs server-side so the
// Nominatim usage policy (descriptive User-Agent) is honoured.
export async function geocodeAddressAction(
  query: string,
): Promise<{ lat: number; lng: number } | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const q = (query ?? "").trim().slice(0, 300);
  if (!q) return null;
  return geocodeOne(q, "de");
}
