// Driving distance/time between two points, behind a small provider seam.
// Default driver: OSRM (free, no key). Always resolves — if routing is
// unavailable it falls back to straight-line (haversine) distance so the
// roadtrip table never breaks. Set ROUTING_PROVIDER=none to skip OSRM.

export type LatLng = { lat: number; lng: number };
export type RouteResult = { distanceKm: number; durationMinutes: number | null };

const EARTH_KM = 6371;
const toRad = (d: number) => (d * Math.PI) / 180;

/** Great-circle distance in km. */
export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Pure parser for an OSRM /route response (separated so it's testable). */
export function parseOsrmRoute(json: unknown): RouteResult | null {
  const route = (json as { routes?: { distance?: unknown; duration?: unknown }[] })
    ?.routes?.[0];
  if (!route || typeof route.distance !== "number") return null;
  return {
    distanceKm: route.distance / 1000,
    durationMinutes: typeof route.duration === "number" ? route.duration / 60 : null,
  };
}

const OSRM_URL = process.env.OSRM_URL ?? "https://router.project-osrm.org";

async function osrmRoute(from: LatLng, to: LatLng): Promise<RouteResult | null> {
  try {
    const url = `${OSRM_URL}/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=false`;
    const res = await fetch(url, { next: { revalidate: 604800 } });
    if (!res.ok) return null;
    return parseOsrmRoute(await res.json());
  } catch {
    return null;
  }
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Distance/time for one leg; straight-line distance if routing is unavailable. */
export async function routeLeg(from: LatLng, to: LatLng): Promise<RouteResult> {
  const routed = process.env.ROUTING_PROVIDER === "none" ? null : await osrmRoute(from, to);
  if (routed) {
    return {
      distanceKm: round1(routed.distanceKm),
      durationMinutes: routed.durationMinutes != null ? Math.round(routed.durationMinutes) : null,
    };
  }
  return { distanceKm: round1(haversineKm(from, to)), durationMinutes: null };
}
