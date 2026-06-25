import type { SpotCategory } from "@/lib/validation";
import type { PlaceKind, PlaceResult } from "./types";

// Each search "kind" groups spot categories (used to filter already-categorised
// results, e.g. from Wikivoyage) and carries Overpass selectors for the OSM POI
// search. Labels are the German UI text.
export const PLACE_KINDS: Record<
  PlaceKind,
  { label: string; categories: SpotCategory[]; overpass: string[] }
> = {
  sights: {
    label: "Sehenswürdigkeiten",
    categories: ["sightseeing", "museum"],
    overpass: [
      'nwr["tourism"~"^(attraction|museum|gallery|viewpoint|artwork|theme_park)$"]',
      'nwr["historic"~"^(monument|memorial|castle|ruins)$"]',
    ],
  },
  food: {
    label: "Restaurants & Cafés",
    categories: ["restaurant", "cafe"],
    overpass: ['nwr["amenity"~"^(restaurant|cafe)$"]'],
  },
  nightlife: {
    label: "Bars & Nachtleben",
    categories: ["bar", "nightlife"],
    overpass: ['nwr["amenity"~"^(bar|pub|nightclub|biergarten)$"]'],
  },
  nature: {
    label: "Natur & Parks",
    categories: ["nature"],
    overpass: [
      'nwr["leisure"~"^(park|garden|nature_reserve)$"]',
      'nwr["natural"~"^(beach|peak|wood)$"]',
    ],
  },
  shopping: {
    label: "Einkaufen",
    categories: ["shopping"],
    overpass: [
      'nwr["shop"~"^(mall|department_store|supermarket)$"]',
      'nwr["amenity"="marketplace"]',
    ],
  },
};

export function isPlaceKind(value: string): value is PlaceKind {
  return Object.prototype.hasOwnProperty.call(PLACE_KINDS, value);
}

/** Default spot category to apply when a result has none but a kind was chosen. */
export function defaultCategoryForKind(
  kind: PlaceKind | undefined,
): SpotCategory | undefined {
  return kind ? PLACE_KINDS[kind].categories[0] : undefined;
}

/** Keeps only results whose category belongs to the kind (for categorised providers). */
export function filterResultsByKind(
  results: PlaceResult[],
  kind?: PlaceKind,
): PlaceResult[] {
  if (!kind) return results;
  const categories = PLACE_KINDS[kind].categories;
  return results.filter(
    (r) => r.category != null && categories.includes(r.category),
  );
}
