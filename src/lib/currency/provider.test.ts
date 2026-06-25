import { describe, it, expect } from "vitest";
import { convertAmount } from "./provider";
import { mockProvider } from "./mock";

describe("convertAmount", () => {
  it("multiplies and rounds to cents", () => {
    expect(convertAmount(100, 1.1)).toBe(110);
    expect(convertAmount(10, 0.835)).toBe(8.35);
    expect(convertAmount(3, 1 / 3)).toBe(1);
  });
});

describe("mockProvider", () => {
  it("returns 1 for the same currency", async () => {
    expect((await mockProvider.getRate("EUR", "EUR")).rate).toBe(1);
  });
  it("returns a deterministic positive rate otherwise", async () => {
    const r = await mockProvider.getRate("EUR", "USD");
    expect(r.rate).toBeGreaterThan(0);
    expect(r.source).toBe("mock");
  });
});
