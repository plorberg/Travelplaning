import { describe, it, expect } from "vitest";
import { suggestTripStatus } from "./trip-status";

const trip = (status: Parameters<typeof suggestTripStatus>[0]["status"], startDate: string | null, endDate: string | null) => ({
  status,
  startDate,
  endDate,
});

describe("suggestTripStatus", () => {
  it("suggests active while the trip is running", () => {
    expect(suggestTripStatus(trip("planning", "2026-07-01", "2026-07-10"), "2026-07-05")).toEqual({
      status: "active",
      reason: "Die Reise läuft gerade.",
    });
    expect(suggestTripStatus(trip("booked", "2026-07-05", "2026-07-10"), "2026-07-05")?.status).toBe("active");
  });

  it("suggests completed after the end date", () => {
    expect(suggestTripStatus(trip("active", "2026-07-01", "2026-07-10"), "2026-07-11")?.status).toBe("completed");
    expect(suggestTripStatus(trip("planning", "2026-07-01", null), "2026-07-02")?.status).toBe("completed");
  });

  it("stays quiet when the status already fits", () => {
    expect(suggestTripStatus(trip("active", "2026-07-01", "2026-07-10"), "2026-07-05")).toBeNull();
    expect(suggestTripStatus(trip("completed", "2026-07-01", "2026-07-10"), "2026-07-11")).toBeNull();
    expect(suggestTripStatus(trip("planning", "2026-07-01", "2026-07-10"), "2026-06-01")).toBeNull();
  });

  it("never nudges archived trips or trips without dates", () => {
    expect(suggestTripStatus(trip("archived", "2026-07-01", "2026-07-10"), "2026-07-05")).toBeNull();
    expect(suggestTripStatus(trip("planning", null, null), "2026-07-05")).toBeNull();
  });
});
