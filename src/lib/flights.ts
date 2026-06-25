// Flight "search" is a deep-link handoff, not an API integration: we build a
// Google Flights URL from the user's criteria and let them search there, then
// save the chosen flight manually as a document. No scraping, no API key, and
// no dependency on any undocumented binary URL params — just the public
// natural-language `q` query. This keeps the MVP on free tiers; a real
// provider (Amadeus/Duffel) could later sit behind the same criteria shape.

export type CabinClass = "economy" | "premium-economy" | "business" | "first";

export const cabinClassValues: readonly CabinClass[] = [
  "economy",
  "premium-economy",
  "business",
  "first",
];

export type FlightSearchCriteria = {
  origin: string;
  destination: string;
  departDate?: string; // YYYY-MM-DD
  returnDate?: string; // YYYY-MM-DD
  passengers?: number;
  cabin?: CabinClass;
  /** ISO currency code for the prices Google Flights shows. */
  currency?: string;
};

const cabinPhrase: Record<CabinClass, string> = {
  economy: "economy",
  "premium-economy": "premium economy",
  business: "business",
  first: "first",
};

/**
 * Builds a Google Flights deep link from search criteria. Returns null when
 * origin or destination is missing (nothing meaningful to search for).
 */
export function buildGoogleFlightsUrl(c: FlightSearchCriteria): string | null {
  const origin = c.origin.trim();
  const destination = c.destination.trim();
  if (!origin || !destination) return null;

  const parts = ["Flights", `from ${origin}`, `to ${destination}`];
  if (c.departDate) parts.push(`on ${c.departDate}`);
  if (c.returnDate) parts.push(`returning ${c.returnDate}`);
  const passengers = c.passengers ?? 1;
  if (passengers > 1) parts.push(`for ${passengers} passengers`);
  if (c.cabin) parts.push(`in ${cabinPhrase[c.cabin]} class`);

  const params = new URLSearchParams({ q: parts.join(" "), hl: "de" });
  if (c.currency) params.set("curr", c.currency);
  return `https://www.google.com/travel/flights?${params.toString()}`;
}
