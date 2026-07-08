import type { Geocoder } from "./provider";

// Nominatim: free OpenStreetMap geocoding, no API key. The usage policy asks for
// a descriptive User-Agent and light, non-bulk use (max ~1 req/s), which suits
// interactive per-stop lookups. https://operations.osmfoundation.org/policies/nominatim/
export const nominatimProvider: Geocoder = {
  name: "nominatim",
  async geocode(query) {
    const q = query.trim();
    if (!q) return null;
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      q,
    )}&format=jsonv2&limit=1`;
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Travelplaning/1.0 (https://github.com/plorberg/Travelplaning)",
        "Accept-Language": "en",
      },
      next: { revalidate: 86400 },
    });
    if (!res.ok) throw new Error("Geocoding lookup failed.");
    const data = (await res.json()) as Array<{
      lat: string;
      lon: string;
      display_name: string;
    }>;
    const hit = data[0];
    if (!hit) return null;
    const lat = Number(hit.lat);
    const lng = Number(hit.lon);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
    return { lat, lng, displayName: hit.display_name, source: "nominatim" };
  },
};
