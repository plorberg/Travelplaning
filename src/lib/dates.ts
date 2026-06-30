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

const MS_PER_DAY = 86_400_000;
const daysBetween = (a: string, b: string) =>
  Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / MS_PER_DAY);

/**
 * A short status line for a trip relative to `today` (all ISO YYYY-MM-DD):
 * upcoming → "Startet in N Tagen", current → "Läuft · Tag X von N",
 * past → "Vor N Tagen beendet". Null if the trip has no start date.
 */
export function tripCountdown(range: DateRange, today: string): string | null {
  const { startDate } = range;
  if (!startDate) return null;
  const endDate = range.endDate ?? startDate;

  if (today < startDate) {
    const days = daysBetween(today, startDate);
    return days === 1 ? "Startet morgen" : `Startet in ${days} Tagen`;
  }
  if (today <= endDate) {
    const dayNo = daysBetween(startDate, today) + 1;
    const total = daysBetween(startDate, endDate) + 1;
    return `Läuft · Tag ${dayNo} von ${total}`;
  }
  const days = daysBetween(endDate, today);
  return days === 1 ? "Gestern beendet" : `Vor ${days} Tagen beendet`;
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
