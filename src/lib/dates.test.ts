import { describe, it, expect } from "vitest";
import { stopDateWarnings, tripCountdown } from "./dates";

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
    ).toContain("Die Ankunft liegt vor dem Startdatum der Reise.");
  });

  it("warns when departure exceeds the trip end", () => {
    expect(
      stopDateWarnings(trip, { arrivalDate: "2026-07-02", departureDate: "2026-07-20" }),
    ).toContain("Die Abreise liegt nach dem Enddatum der Reise.");
  });

  it("warns when departure precedes arrival", () => {
    expect(
      stopDateWarnings(trip, { arrivalDate: "2026-07-05", departureDate: "2026-07-02" }),
    ).toContain("Die Abreise liegt vor der Ankunft.");
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

describe("tripCountdown", () => {
  it("counts down to an upcoming trip", () => {
    expect(tripCountdown(trip, "2026-06-24")).toBe("Startet in 7 Tagen");
    expect(tripCountdown(trip, "2026-06-30")).toBe("Startet morgen");
  });

  it("shows the current day of an ongoing trip", () => {
    expect(tripCountdown(trip, "2026-07-01")).toBe("Läuft · Tag 1 von 10");
    expect(tripCountdown(trip, "2026-07-05")).toBe("Läuft · Tag 5 von 10");
    expect(tripCountdown(trip, "2026-07-10")).toBe("Läuft · Tag 10 von 10");
  });

  it("reports a finished trip", () => {
    expect(tripCountdown(trip, "2026-07-11")).toBe("Gestern beendet");
    expect(tripCountdown(trip, "2026-07-15")).toBe("Vor 5 Tagen beendet");
  });

  it("returns null without a start date", () => {
    expect(tripCountdown({ startDate: null, endDate: null }, "2026-07-01")).toBeNull();
  });
});
