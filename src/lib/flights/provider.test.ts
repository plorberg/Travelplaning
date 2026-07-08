import { describe, it, expect } from "vitest";
import { buildGoogleFlightsUrl } from "./google-flights";

const q = (url: string) => decodeURIComponent(url.split("q=")[1] ?? "");

describe("buildGoogleFlightsUrl", () => {
  it("builds a one-way query", () => {
    const url = buildGoogleFlightsUrl({
      origin: "Berlin",
      destination: "Tokyo",
      departDate: "2026-08-01",
    });
    expect(url.startsWith("https://www.google.com/travel/flights?q=")).toBe(
      true,
    );
    expect(q(url)).toBe("Flights from Berlin to Tokyo on 2026-08-01");
  });

  it("includes return date, passengers, and cabin", () => {
    const url = buildGoogleFlightsUrl({
      origin: "JFK",
      destination: "LHR",
      departDate: "2026-08-01",
      returnDate: "2026-08-10",
      passengers: 2,
      cabin: "premium_economy",
    });
    expect(q(url)).toBe(
      "Flights from JFK to LHR on 2026-08-01 returning 2026-08-10 for 2 passengers in premium economy class",
    );
  });

  it("omits a single passenger and returns empty when an endpoint is missing", () => {
    expect(q(buildGoogleFlightsUrl({ origin: "A", destination: "B", passengers: 1 }))).toBe(
      "Flights from A to B",
    );
    expect(buildGoogleFlightsUrl({ origin: "", destination: "Tokyo" })).toBe("");
    expect(buildGoogleFlightsUrl({ origin: "Berlin", destination: "  " })).toBe("");
  });
});
