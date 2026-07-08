// Pure status-lifecycle suggestion (no DB) so it can be unit-tested. Dates are
// ISO strings (YYYY-MM-DD), which compare correctly lexicographically.

export type TripStatus = "planning" | "booked" | "active" | "completed" | "archived";

export interface StatusSuggestion {
  status: TripStatus;
  reason: string;
}

/**
 * Suggests a forward status transition based on the trip dates, or null when
 * the current status already fits (or there is not enough information).
 * Never suggests anything for archived trips — that is an explicit choice.
 */
export function suggestTripStatus(
  trip: { status: TripStatus; startDate: string | null; endDate: string | null },
  today: string,
): StatusSuggestion | null {
  const { status, startDate } = trip;
  if (status === "archived" || !startDate) return null;
  const endDate = trip.endDate ?? startDate;

  if (today > endDate) {
    if (status !== "completed") {
      return { status: "completed", reason: "Die Reise ist vorbei." };
    }
    return null;
  }

  if (today >= startDate && (status === "planning" || status === "booked")) {
    return { status: "active", reason: "Die Reise läuft gerade." };
  }

  return null;
}
