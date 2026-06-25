import type { PlaceResult, PlacesProvider } from "./types";
import { nominatimProvider } from "./nominatim";
import { mockProvider } from "./mock";

export type { PlaceResult } from "./types";

// Default to the free, no-key OpenStreetMap driver; opt into the mock via env.
export function getPlacesProvider(): PlacesProvider {
  return process.env.PLACES_PROVIDER === "mock" ? mockProvider : nominatimProvider;
}

export function searchPlaces(
  query: string,
  opts?: { limit?: number; lang?: string },
): Promise<PlaceResult[]> {
  return getPlacesProvider().search(query, opts);
}
