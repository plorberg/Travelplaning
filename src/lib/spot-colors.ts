// Marker colour per saved-spot category, shared by the map markers and legend.
export const STOP_COLOR = "#1d4ed8";
export const DEFAULT_SPOT_COLOR = "#b45309";

export const SPOT_CATEGORY_COLORS: Record<string, string> = {
  sightseeing: "#2563eb",
  restaurant: "#dc2626",
  cafe: "#b45309",
  bar: "#7c3aed",
  museum: "#0891b2",
  nature: "#16a34a",
  shopping: "#db2777",
  nightlife: "#4f46e5",
  hidden_gem: "#ca8a04",
  family_friendly: "#0d9488",
  rainy_day: "#64748b",
};

export function spotColor(category?: string | null): string {
  return (category && SPOT_CATEGORY_COLORS[category]) || DEFAULT_SPOT_COLOR;
}
