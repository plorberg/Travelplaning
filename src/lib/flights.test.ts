import { describe, it, expect } from "vitest";
import { buildGoogleFlightsUrl, buildSkyscannerUrl } from "./flights";

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

describe("buildSkyscannerUrl", () => {
  it("returns null without both codes", () => {
    expect(buildSkyscannerUrl({ origin: "BER", destination: "" })).toBeNull();
  });

  it("builds a round-trip URL carrying passengers, cabin and dates", () => {
    const url = buildSkyscannerUrl({
      origin: "BER",
      destination: "AKL",
      departDate: "2026-11-08",
      returnDate: "2026-11-28",
      passengers: 2,
      cabin: "business",
      currency: "EUR",
    })!;
    expect(url).toContain("/transport/fluge/ber/akl/261108/261128/");
    const sp = new URL(url).searchParams;
    expect(sp.get("adults")).toBe("2");
    expect(sp.get("cabinclass")).toBe("business");
    expect(sp.get("currency")).toBe("EUR");
  });

  it("omits the return segment for a one-way trip", () => {
    const url = buildSkyscannerUrl({
      origin: "BER",
      destination: "AKL",
      departDate: "2026-11-08",
    })!;
    expect(url).toContain("/transport/fluge/ber/akl/261108/?");
    expect(new URL(url).searchParams.get("adults")).toBe("1");
  });
});
