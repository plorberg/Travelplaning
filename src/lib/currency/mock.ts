import type { CurrencyProvider } from "./provider";

// Deterministic offline rates for development and tests (no network).
// Values are units of each currency per 1 EUR.
const PER_EUR: Record<string, number> = {
  EUR: 1,
  USD: 1.08,
  GBP: 0.85,
  CHF: 0.96,
  JPY: 162,
};

export const mockProvider: CurrencyProvider = {
  name: "mock",
  async getRate(from, to) {
    if (from === to) return { rate: 1, source: "mock", fetchedAt: new Date() };
    const fromPerEur = PER_EUR[from] ?? 1;
    const toPerEur = PER_EUR[to] ?? 1;
    const rate = Math.round((toPerEur / fromPerEur) * 1e6) / 1e6;
    return { rate, source: "mock", fetchedAt: new Date() };
  },
};
