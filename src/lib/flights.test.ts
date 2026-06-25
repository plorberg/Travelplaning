import { describe, it, expect } from "vitest";
import { buildGoogleFlightsUrl } from "./flights";

function q(url: string): string {
  return new URL(url).searchParams.get("q") ?? "";
}

describe("buildGoogleFlightsUrl", () => {
  it("returns null without both origin and destination", () => {
    expect(buildGoogleFlightsUrl({ origin: "BER", destination: "" })).toBeNull();
    expect(buildGoogleFlightsUrl({ origin: " ", destination: "AKL" })).toBeNull();
  });

  it("builds a one-way query", () => {
    const url = buildGoogleFlightsUrl({
      origin: "BER",
      destination: "AKL",
      departDate: "2026-11-08",
    })!;
    expect(q(url)).toBe("Flights from BER to AKL on 2026-11-08");
    expect(new URL(url).searchParams.get("hl")).toBe("de");
  });

  it("includes return date, passengers, cabin and currency", () => {
    const url = buildGoogleFlightsUrl({
      origin: "Berlin",
      destination: "Auckland",
      departDate: "2026-11-08",
      returnDate: "2026-11-28",
      passengers: 2,
      cabin: "business",
      currency: "NZD",
    })!;
    expect(q(url)).toBe(
      "Flights from Berlin to Auckland on 2026-11-08 returning 2026-11-28 for 2 passengers in business class",
    );
    expect(new URL(url).searchParams.get("curr")).toBe("NZD");
  });

  it("omits a single passenger from the query", () => {
    const url = buildGoogleFlightsUrl({
      origin: "BER",
      destination: "AKL",
      passengers: 1,
    })!;
    expect(q(url)).toBe("Flights from BER to AKL");
  });
});
