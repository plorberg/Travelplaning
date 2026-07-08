import { googleFlightsProvider } from "./google-flights";
import type { FlightProvider } from "./provider";

// Only the free Google Flights deep-link driver exists today; future
// Amadeus/Duffel drivers would be selected here behind the same interface.
export function getFlightProvider(): FlightProvider {
  return googleFlightsProvider;
}

export { buildGoogleFlightsUrl } from "./google-flights";
export type {
  FlightProvider,
  FlightSearchCriteria,
  CabinClass,
} from "./provider";
