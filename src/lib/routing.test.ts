import { describe, it, expect } from "vitest";
import { haversineKm, parseOsrmRoute } from "./routing";

describe("haversineKm", () => {
  it("is ~0 for the same point", () => {
    expect(haversineKm({ lat: -36.85, lng: 174.76 }, { lat: -36.85, lng: 174.76 })).toBeCloseTo(0, 5);
  });

  it("approximates a known distance (Auckland → Rotorua ~195 km)", () => {
    const km = haversineKm({ lat: -36.85, lng: 174.76 }, { lat: -38.14, lng: 176.25 });
    expect(km).toBeGreaterThan(180);
    expect(km).toBeLessThan(210);
  });
});

describe("parseOsrmRoute", () => {
  it("extracts km and minutes from the first route", () => {
    expect(parseOsrmRoute({ routes: [{ distance: 234000, duration: 10800 }] })).toEqual({
      distanceKm: 234,
      durationMinutes: 180,
    });
  });

  it("returns null for empty/invalid responses", () => {
    expect(parseOsrmRoute({ routes: [] })).toBeNull();
    expect(parseOsrmRoute(null)).toBeNull();
    expect(parseOsrmRoute({ code: "NoRoute" })).toBeNull();
  });
});
