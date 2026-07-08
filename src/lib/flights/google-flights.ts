import type { FlightProvider, FlightSearchCriteria } from "./provider";

// Build a Google Flights deep link from search criteria using the natural-
// language `q=` parameter. This avoids the fragile, undocumented `tfs` protobuf
// encoding and does not assume an official API — Google parses the query and
// shows a matching search. Returns "" until both endpoints are provided.
export function buildGoogleFlightsUrl(c: FlightSearchCriteria): string {
  const origin = c.origin.trim();
  const destination = c.destination.trim();
  if (!origin || !destination) return "";

  const parts = [`Flights from ${origin} to ${destination}`];
  if (c.departDate) parts.push(`on ${c.departDate}`);
  if (c.returnDate) parts.push(`returning ${c.returnDate}`);
  if (c.passengers && c.passengers > 1) {
    parts.push(`for ${c.passengers} passengers`);
  }
  if (c.cabin) parts.push(`in ${c.cabin.replace("_", " ")} class`);

  return `https://www.google.com/travel/flights?q=${encodeURIComponent(
    parts.join(" "),
  )}`;
}

export const googleFlightsProvider: FlightProvider = {
  name: "google-flights",
  buildSearchUrl: buildGoogleFlightsUrl,
};
