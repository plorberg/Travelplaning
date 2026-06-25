export interface RateResult {
  rate: number; // value of 1 unit of `from` expressed in `to`
  source: string; // "frankfurter" | "mock" | "manual" | "identity"
  fetchedAt: Date;
}

export interface CurrencyProvider {
  name: string;
  getRate(from: string, to: string): Promise<RateResult>;
}

/** Convert an amount using a rate, rounded to cents. Pure — unit-tested. */
export function convertAmount(amount: number, rate: number): number {
  return Math.round(amount * rate * 100) / 100;
}
