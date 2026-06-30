import { spotCategoryLabels } from "@/lib/labels";

export type MapPoint = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  kind: "stop" | "spot";
  category?: string; // saved-spot category key, for colouring
  sub?: string;
};

type StopRow = {
  id: string;
  city: string;
  country: string | null;
  lat: number | null;
  lng: number | null;
};

type SpotRow = {
  id: string;
  name: string;
  category: string | null;
  lat: number | null;
  lng: number | null;
};

const hasCoords = (r: { lat: number | null; lng: number | null }): boolean =>
  r.lat != null && r.lng != null;

/** Builds map markers from stops and saved spots, dropping any without coordinates. */
export function toMapPoints(stops: StopRow[], spots: SpotRow[]): MapPoint[] {
  const stopPoints: MapPoint[] = stops.filter(hasCoords).map((s) => ({
    id: `stop-${s.id}`,
    name: s.city,
    lat: s.lat as number,
    lng: s.lng as number,
    kind: "stop",
    sub: s.country ?? undefined,
  }));

  const spotPoints: MapPoint[] = spots.filter(hasCoords).map((s) => ({
    id: `spot-${s.id}`,
    name: s.name,
    lat: s.lat as number,
    lng: s.lng as number,
    kind: "spot",
    category: s.category ?? undefined,
    sub: s.category ? (spotCategoryLabels[s.category] ?? s.category) : undefined,
  }));

  return [...stopPoints, ...spotPoints];
}
