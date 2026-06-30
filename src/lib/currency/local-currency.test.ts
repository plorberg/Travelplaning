import { describe, it, expect } from "vitest";
import { localCurrencyForDestination } from "./local-currency";

describe("localCurrencyForDestination", () => {
  it("derives the currency from the main destination", () => {
    expect(localCurrencyForDestination("Japan")).toBe("JPY");
    expect(localCurrencyForDestination("Tokyo, Japan")).toBe("JPY");
    expect(localCurrencyForDestination("Neuseeland")).toBe("NZD");
  });

  it("prefers stop countries over the main destination text", () => {
    expect(localCurrencyForDestination("Rundreise", ["Thailand"])).toBe("THB");
  });

  it("maps eurozone countries to EUR", () => {
    expect(localCurrencyForDestination("Frankreich")).toBe("EUR");
    expect(localCurrencyForDestination("Italien")).toBe("EUR");
  });

  it("returns null for unknown or empty destinations", () => {
    expect(localCurrencyForDestination("Irgendwo")).toBeNull();
    expect(localCurrencyForDestination("")).toBeNull();
    expect(localCurrencyForDestination(null, [])).toBeNull();
  });

  it("does not false-match short codes inside other words", () => {
    // "usa" must not match inside e.g. "Jerusalem".
    expect(localCurrencyForDestination("Jerusalem")).not.toBe("USD");
  });
});
