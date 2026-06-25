// Pure date helpers (no DB) so they can be unit-tested. Dates are ISO strings
// (YYYY-MM-DD), which compare correctly lexicographically.

export interface DateRange {
  startDate: string | null;
  endDate: string | null;
}

export interface StopDates {
  arrivalDate: string | null;
  departureDate: string | null;
}

/**
 * Non-blocking warnings when a stop's dates fall outside the trip window or are
 * internally inconsistent. Surfaced in the UI as warnings, never hard blocks.
 */
export function stopDateWarnings(trip: DateRange, stop: StopDates): string[] {
  const warnings: string[] = [];
  if (stop.arrivalDate && trip.startDate && stop.arrivalDate < trip.startDate) {
    warnings.push("Die Ankunft liegt vor dem Startdatum der Reise.");
  }
  if (stop.departureDate && trip.endDate && stop.departureDate > trip.endDate) {
    warnings.push("Die Abreise liegt nach dem Enddatum der Reise.");
  }
  if (
    stop.arrivalDate &&
    stop.departureDate &&
    stop.departureDate < stop.arrivalDate
  ) {
    warnings.push("Die Abreise liegt vor der Ankunft.");
  }
  return warnings;
}
