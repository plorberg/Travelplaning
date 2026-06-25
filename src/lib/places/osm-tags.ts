import type { SpotCategory } from "@/lib/validation";

// Maps an OSM tag value (and broad key) to our spot categories. Shared by the
// Nominatim, Overpass and Wikivoyage (vCard) parsers. Keys are OSM-style tag
// values, which is also what Wikivoyage's German vCard `type=` uses.
const TYPE_TABLE: Record<string, SpotCategory> = {
  // sightseeing
  attraction: "sightseeing",
  artwork: "sightseeing",
  viewpoint: "sightseeing",
  monument: "sightseeing",
  memorial: "sightseeing",
  castle: "sightseeing",
  ruins: "sightseeing",
  place_of_worship: "sightseeing",
  square: "sightseeing",
  building: "sightseeing",
  tourist: "sightseeing",
  // museum
  museum: "museum",
  gallery: "museum",
  // food
  restaurant: "restaurant",
  fast_food: "restaurant",
  food_court: "restaurant",
  cafe: "cafe",
  // nightlife / bars
  bar: "bar",
  pub: "bar",
  biergarten: "bar",
  nightclub: "nightlife",
  club: "nightlife",
  // nature
  park: "nature",
  nature_reserve: "nature",
  peak: "nature",
  beach: "nature",
  forest: "nature",
  wood: "nature",
  water: "nature",
  garden: "nature",
  botanical: "nature",
  island: "nature",
  // shopping
  mall: "shopping",
  shopping: "shopping",
  supermarket: "shopping",
  department_store: "shopping",
  marketplace: "shopping",
  // family friendly
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
  if (c === "historic") return "sightseeing";
  if (c === "natural" || c === "leisure") return "nature";
  if (c === "shop") return "shopping";
  return undefined;
}
