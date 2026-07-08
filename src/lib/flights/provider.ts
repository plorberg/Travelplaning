export type CabinClass = "economy" | "premium_economy" | "business" | "first";

export interface FlightSearchCriteria {
  origin: string;
  destination: string;
  departDate?: string; // yyyy-mm-dd
  returnDate?: string; // yyyy-mm-dd (round trip)
  passengers?: number;
  cabin?: CabinClass;
}

export interface FlightProvider {
  name: string;
  // MVP: hand off to an external flight search via deep link (no scraping, no
  // assumed official API). Future drivers (Amadeus/Duffel) could return results.
  buildSearchUrl(criteria: FlightSearchCriteria): string;
}
