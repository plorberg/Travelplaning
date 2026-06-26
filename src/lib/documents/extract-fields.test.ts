import { describe, it, expect } from "vitest";
import { extractDocumentFields, normalizeAmount } from "./extract-fields";

describe("normalizeAmount", () => {
  it("handles de and en thousand/decimal separators", () => {
    expect(normalizeAmount("1.234,56")).toBe("1234.56");
    expect(normalizeAmount("1,234.56")).toBe("1234.56");
    expect(normalizeAmount("1234,50")).toBe("1234.50");
    expect(normalizeAmount("1.500")).toBe("1500");
    expect(normalizeAmount("49.99")).toBe("49.99");
    expect(normalizeAmount("0")).toBeUndefined();
  });
});

describe("extractDocumentFields", () => {
  it("pulls booking ref, total price+currency and dates from a flight ticket", () => {
    const text = `
      Lufthansa E-Ticket / Buchungsbestätigung
      Buchungsnummer: ABC123
      Hinflug 08.11.2026 BER -> AKL
      Rückflug 28.11.2026 AKL -> BER
      Gesamtbetrag: EUR 1.249,90
    `;
    expect(extractDocumentFields(text)).toEqual({
      bookingRef: "ABC123",
      price: "1249.90",
      currency: "EUR",
      startAt: "2026-11-08",
      endAt: "2026-11-28",
    });
  });

  it("handles English wording and symbol-prefixed amounts", () => {
    const out = extractDocumentFields(
      "Booking reference XY9Z7Q\nTotal: $349.00\nCheck-in 2026-07-05",
    );
    expect(out.bookingRef).toBe("XY9Z7Q");
    expect(out).toMatchObject({ price: "349.00", currency: "USD", startAt: "2026-07-05" });
    expect(out.endAt).toBeUndefined();
  });

  it("returns an empty object when nothing matches", () => {
    expect(extractDocumentFields("Just some unrelated prose without data.")).toEqual({});
  });
});
