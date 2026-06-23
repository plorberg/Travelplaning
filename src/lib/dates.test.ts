import { describe, it, expect } from "vitest";
import { stopDateWarnings } from "./dates";

const trip = { startDate: "2026-07-01", endDate: "2026-07-10" };

describe("stopDateWarnings", () => {
  it("returns no warnings for an in-range stop", () => {
    expect(
      stopDateWarnings(trip, { arrivalDate: "2026-07-02", departureDate: "2026-07-05" }),
    ).toEqual([]);
  });

  it("warns when arrival precedes the trip start", () => {
    expect(
      stopDateWarnings(trip, { arrivalDate: "2026-06-30", departureDate: "2026-07-05" }),
    ).toContain("Arrival is before the trip start date.");
  });

  it("warns when departure exceeds the trip end", () => {
    expect(
      stopDateWarnings(trip, { arrivalDate: "2026-07-02", departureDate: "2026-07-20" }),
    ).toContain("Departure is after the trip end date.");
  });

  it("warns when departure precedes arrival", () => {
    expect(
      stopDateWarnings(trip, { arrivalDate: "2026-07-05", departureDate: "2026-07-02" }),
    ).toContain("Departure is before arrival.");
  });

  it("ignores missing dates", () => {
    expect(
      stopDateWarnings(
        { startDate: null, endDate: null },
        { arrivalDate: null, departureDate: null },
      ),
    ).toEqual([]);
  });
});
