import type { Geocoder } from "./provider";

// Offline driver for development and tests (no network). Known cities return
// real coordinates; anything else gets a deterministic in-range coordinate so
// the map still renders.
const CITIES: Record<string, [number, number]> = {
  berlin: [52.52, 13.405],
  paris: [48.8566, 2.3522],
  london: [51.5074, -0.1278],
  "new york": [40.7128, -74.006],
  tokyo: [35.6762, 139.6503],
  rome: [41.9028, 12.4964],
};

export const mockProvider: Geocoder = {
  name: "mock",
  async geocode(query) {
    const q = query.trim().toLowerCase();
    if (!q) return null;

    const known = Object.keys(CITIES).find((city) => q.includes(city));
    if (known) {
      const [lat, lng] = CITIES[known];
      return { lat, lng, displayName: query.trim(), source: "mock" };
    }

    let hash = 0;
    for (let i = 0; i < q.length; i++) hash = (hash * 31 + q.charCodeAt(i)) | 0;
    const lat = (Math.abs(hash) % 18000) / 100 - 90;
    const lng = (Math.abs(hash >> 3) % 36000) / 100 - 180;
    return { lat, lng, displayName: query.trim(), source: "mock" };
  },
};
