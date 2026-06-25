import type { PlaceKind, PlaceResult, PlacesProvider } from "./types";
import { nominatimProvider } from "./nominatim";
import { wikivoyageProvider } from "./wikivoyage";
import { mockProvider } from "./mock";

export type { PlaceResult, PlaceKind } from "./types";
export {
  PLACE_KINDS,
  isPlaceKind,
  defaultCategoryForKind,
} from "./kinds";

const providers: Record<string, PlacesProvider> = {
  nominatim: nominatimProvider,
  wikivoyage: wikivoyageProvider,
  mock: mockProvider,
};

// Pick a named provider; otherwise honour PLACES_PROVIDER; default Nominatim.
export function getPlacesProvider(name?: string): PlacesProvider {
  if (name && providers[name]) return providers[name];
  const env = process.env.PLACES_PROVIDER;
  if (env && providers[env]) return providers[env];
  return nominatimProvider;
}

export function searchPlaces(
  query: string,
  opts?: { provider?: string; limit?: number; lang?: string; kind?: PlaceKind },
): Promise<PlaceResult[]> {
  return getPlacesProvider(opts?.provider).search(query, opts);
}
