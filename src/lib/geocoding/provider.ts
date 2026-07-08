export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string; // human-readable place name from the provider
  source: string; // "nominatim" | "mock"
}

export interface Geocoder {
  name: string;
  geocode(query: string): Promise<GeocodeResult | null>;
}
