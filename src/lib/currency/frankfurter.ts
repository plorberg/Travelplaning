import type { CurrencyProvider } from "./provider";

// Frankfurter: free European Central Bank rates, no API key, ~30 currencies.
// https://frankfurter.dev
export const frankfurterProvider: CurrencyProvider = {
  name: "frankfurter",
  async getRate(from, to) {
    if (from === to) {
      return { rate: 1, source: "frankfurter", fetchedAt: new Date() };
    }
    const url = `https://api.frankfurter.dev/v1/latest?base=${encodeURIComponent(
      from,
    )}&symbols=${encodeURIComponent(to)}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error("Currency rate lookup failed.");
    const data = (await res.json()) as { rates?: Record<string, number> };
    const rate = data.rates?.[to];
    if (typeof rate !== "number") {
      throw new Error(`No rate available for ${from} → ${to}.`);
    }
    return { rate, source: "frankfurter", fetchedAt: new Date() };
  },
};
