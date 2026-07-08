import { nominatimProvider } from "./nominatim";
import { mockProvider } from "./mock";
import type { Geocoder } from "./provider";

// Default to the free Nominatim (OpenStreetMap) driver; set GEOCODER=mock for
// offline development. Paid geocoders can be added here behind the interface.
export function getGeocoder(): Geocoder {
  switch (process.env.GEOCODER) {
    case "mock":
      return mockProvider;
    default:
      return nominatimProvider;
  }
}

export type { Geocoder, GeocodeResult } from "./provider";
