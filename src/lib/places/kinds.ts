import type { SpotCategory } from "@/lib/validation";
import type { PlaceKind, PlaceResult } from "./types";

// Each search "kind" groups spot categories (used to filter already-categorised
// results, e.g. from Wikivoyage) and carries an OSM keyword to bias the
// free-text geocoder (Nominatim). Labels are the German UI text.
export const PLACE_KINDS: Record<
  PlaceKind,
  { label: string; categories: SpotCategory[]; osmKeyword: string }
> = {
  sights: {
    label: "Sehenswürdigkeiten",
    categories: ["sightseeing", "museum"],
    osmKeyword: "tourist attraction",
  },
  food: {
    label: "Restaurants & Cafés",
    categories: ["restaurant", "cafe"],
    osmKeyword: "restaurant",
  },
  nightlife: {
    label: "Bars & Nachtleben",
    categories: ["bar", "nightlife"],
    osmKeyword: "bar",
  },
  nature: {
    label: "Natur & Parks",
    categories: ["nature"],
    osmKeyword: "park",
  },
  shopping: {
    label: "Einkaufen",
    categories: ["shopping"],
    osmKeyword: "shop",
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

/** Prefixes a free-text query with the kind's OSM keyword to bias the geocoder. */
export function applyKindToQuery(query: string, kind?: PlaceKind): string {
  const q = query.trim();
  if (!kind || !q) return q;
  return `${PLACE_KINDS[kind].osmKeyword} ${q}`;
}
