import type { PlacesProvider } from "./types";

// Deterministic offline driver for development/tests (PLACES_PROVIDER=mock).
export const mockProvider: PlacesProvider = {
  name: "mock",
  async search(query) {
    const q = query.trim();
    if (!q) return [];
    return [
      {
        id: "mock/1",
        name: `${q} Museum`,
        address: `${q} Museum, Musterstraße 1`,
        lat: 0,
        lng: 0,
        category: "museum",
        source: "Mock",
      },
      {
        id: "mock/2",
        name: `Café ${q}`,
        address: `Café ${q}, Hauptplatz 2`,
        lat: 0,
        lng: 0,
        category: "cafe",
        source: "Mock",
      },
    ];
  },
};
